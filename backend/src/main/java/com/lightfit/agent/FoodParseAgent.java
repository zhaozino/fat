package com.lightfit.agent;

import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationParam;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversation;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationParam;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationResult;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.MultiModalMessage;
import com.alibaba.dashscope.common.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lightfit.config.DashScopeConfig;
import com.lightfit.dto.ParseDTO;
import com.lightfit.service.MemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * FoodParseAgent
 *
 * 职责：将用户自然语言或图片解析为结构化的食物/运动热量数据。
 * - 纯文字 → 调用 Qwen-Max
 * - 图片（含可选文字）→ 调用 Qwen-VL-Max（多模态）
 * 检索长期记忆中用户饮食习惯作为 Prompt 辅助上下文。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FoodParseAgent {

    private final DashScopeConfig config;
    private final MemoryService memoryService;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            你是一个专业的营养师助手。用户会告诉你吃了什么或做了什么运动。
            你必须严格以 JSON 格式回复，不要有任何其他文字，JSON 结构如下：
            {
              "type": "food" 或 "exercise",
              "name": "食物或运动的简短名称",
              "calories": 数字（大卡，整数），
              "displayText": "展示给用户的一句话描述（含食物名和热量）",
              "isEstimated": true 或 false
            }
            - 热量尽量精确，无法确定时给出合理估算并将 isEstimated 设为 true
            - 未识别食物默认 200 大卡，未识别运动默认 100 大卡
            - 只回复 JSON，不要解释
            """;

    /**
     * 解析（纯文字或图片）
     *
     * @param userId   用户 ID（用于检索长期记忆）
     * @param text     用户输入文字（可为空）
     * @param imageUrl 图片 URL（可为空）
     */
    public ParseDTO.ParseResponse parse(String userId, String text, String imageUrl) {
        try {
            // 从长期记忆检索用户偏好，作为系统提示补充
            String memoryContext = memoryService.retrieveContext(userId, text != null ? text : "food");
            String systemPrompt = SYSTEM_PROMPT
                    + (memoryContext.isEmpty() ? "" : "\n用户历史偏好参考：" + memoryContext);

            String rawJson;
            if (imageUrl != null && !imageUrl.isBlank()) {
                rawJson = callVlModel(systemPrompt, text, imageUrl);
            } else {
                rawJson = callTextModel(systemPrompt, text);
            }

            ParseDTO.ParseResponse resp = parseJson(rawJson);

            // 将本次解析结果存入短期记忆
            memoryService.addShortTerm(userId, "user", text != null ? text : "[image]");
            memoryService.addShortTerm(userId, "assistant", rawJson);

            // 异步存入长期记忆
            if (text != null && !text.isBlank()) {
                memoryService.saveToLongTermAsync(userId, resp);
            }

            return resp;

        } catch (Exception e) {
            log.error("FoodParseAgent 解析失败: {}", e.getMessage(), e);
            return fallback(text);
        }
    }

    // ── 纯文字调用 Qwen-Max ──────────────────────────────────────────────────

    private String callTextModel(String systemPrompt, String userText) throws Exception {
        Generation gen = new Generation();
        List<Message> messages = Arrays.asList(
                Message.builder().role(Role.SYSTEM.getValue()).content(systemPrompt).build(),
                Message.builder().role(Role.USER.getValue()).content(userText).build()
        );
        GenerationParam param = GenerationParam.builder()
                .apiKey(config.getApiKey())
                .model(config.getModel())
                .messages(messages)
                .resultFormat(GenerationParam.ResultFormat.MESSAGE)
                .build();
        GenerationResult result = gen.call(param);
        return result.getOutput().getChoices().get(0).getMessage().getContent();
    }

    // ── 多模态调用 Qwen-VL-Max ───────────────────────────────────────────────

    private String callVlModel(String systemPrompt, String userText, String imageUrl) throws Exception {
        MultiModalConversation conv = new MultiModalConversation();

        String prompt = (userText != null && !userText.isBlank())
                ? userText + "（请识别图片中的食物并估算热量）"
                : "请识别图片中的食物，估算热量，以 JSON 格式回答";

        MultiModalMessage userMsg = MultiModalMessage.builder()
                .role(Role.USER.getValue())
                .content(Arrays.asList(
                        Collections.singletonMap("image", imageUrl),
                        Collections.singletonMap("text", prompt)
                ))
                .build();

        MultiModalMessage sysMsg = MultiModalMessage.builder()
                .role(Role.SYSTEM.getValue())
                .content(Collections.singletonList(
                        Collections.singletonMap("text", systemPrompt)
                ))
                .build();

        MultiModalConversationParam param = MultiModalConversationParam.builder()
                .apiKey(config.getApiKey())
                .model(config.getVlModel())
                .messages(Arrays.asList(sysMsg, userMsg))
                .build();

        MultiModalConversationResult result = conv.call(param);
        Object content = result.getOutput().getChoices().get(0).getMessage().getContent();
        // VL 模型返回 List<Map>，取第一个 text
        if (content instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?, ?> map && map.containsKey("text")) {
                return map.get("text").toString();
            }
        }
        return content.toString();
    }

    // ── JSON 解析 ────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private ParseDTO.ParseResponse parseJson(String rawJson) throws Exception {
        // 提取 JSON 块（模型有时会在 JSON 前后多输出文字）
        int start = rawJson.indexOf('{');
        int end   = rawJson.lastIndexOf('}');
        if (start < 0 || end < 0) throw new IllegalArgumentException("无法解析模型输出：" + rawJson);
        String json = rawJson.substring(start, end + 1);

        Map<String, Object> map = objectMapper.readValue(json, Map.class);
        ParseDTO.ParseResponse resp = new ParseDTO.ParseResponse();
        resp.setType(String.valueOf(map.getOrDefault("type", "food")));
        resp.setName(String.valueOf(map.getOrDefault("name", "未知")));
        resp.setCalories(Double.parseDouble(String.valueOf(map.getOrDefault("calories", 200))));
        resp.setDisplayText(String.valueOf(map.getOrDefault("displayText", resp.getName())));
        resp.setIsEstimated(Boolean.parseBoolean(String.valueOf(map.getOrDefault("isEstimated", true))));
        return resp;
    }

    // ── 兜底（模型调用失败时） ────────────────────────────────────────────────

    private ParseDTO.ParseResponse fallback(String text) {
        boolean isExercise = text != null &&
                text.matches(".*(跑|走|骑|游泳|健身|运动|瑜伽|球|操|步).*");
        ParseDTO.ParseResponse resp = new ParseDTO.ParseResponse();
        resp.setType(isExercise ? "exercise" : "food");
        resp.setName(text != null ? text : "未知");
        resp.setCalories(isExercise ? 100.0 : 200.0);
        resp.setDisplayText(text);
        resp.setIsEstimated(true);
        return resp;
    }
}
