package com.lightfit.agent;

import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationParam;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.Role;
import com.lightfit.config.DashScopeConfig;
import com.lightfit.service.MemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * EncourageAgent
 *
 * 职责：根据用户今日热量缺口状态 + 长期记忆中的饮食习惯，
 *       生成个性化鼓励消息（不超过 50 字）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EncourageAgent {

    private final DashScopeConfig config;
    private final MemoryService memoryService;

    private static final String SYSTEM_PROMPT = """
            你是一位温柔专业的减脂营养师。请根据用户今日热量缺口状态，
            生成一句鼓励性话语，要求：
            - 不超过 50 个汉字
            - 语气温暖、积极、不说教
            - 结合用户的饮食习惯个性化表达（如有）
            - 只输出话语本身，不要有任何前缀或解释
            """;

    /**
     * 生成鼓励消息
     *
     * @param userId         用户 ID
     * @param deficit        今日热量缺口（正数 = 有缺口，负数 = 超标）
     * @param targetDeficit  目标缺口
     * @param totalIntake    今日摄入
     * @param totalExercise  今日运动消耗
     */
    public String encourage(String userId, double deficit, double targetDeficit,
                            double totalIntake, double totalExercise) {
        try {
            // 从长期记忆检索用户饮食偏好
            String memoryContext = memoryService.retrieveContext(userId, "饮食习惯 鼓励");

            // 构造用户状态描述
            String statusDesc = buildStatusDesc(deficit, targetDeficit, totalIntake, totalExercise);
            String userMsg = statusDesc
                    + (memoryContext.isEmpty() ? "" : "\n用户饮食偏好参考：" + memoryContext);

            // 将今日状态加入短期记忆
            memoryService.addShortTerm(userId, "user", statusDesc);

            Generation gen = new Generation();
            List<Message> messages = Arrays.asList(
                    Message.builder().role(Role.SYSTEM.getValue()).content(SYSTEM_PROMPT).build(),
                    Message.builder().role(Role.USER.getValue()).content(userMsg).build()
            );
            GenerationParam param = GenerationParam.builder()
                    .apiKey(config.getApiKey())
                    .model(config.getModel())
                    .messages(messages)
                    .resultFormat(GenerationParam.ResultFormat.MESSAGE)
                    .maxTokens(100)
                    .build();

            GenerationResult result = gen.call(param);
            String msg = result.getOutput().getChoices().get(0).getMessage().getContent().trim();
            memoryService.addShortTerm(userId, "assistant", msg);
            return msg;

        } catch (Exception e) {
            log.error("EncourageAgent 失败: {}", e.getMessage());
            return fallback(deficit, targetDeficit);
        }
    }

    private String buildStatusDesc(double deficit, double targetDeficit,
                                   double totalIntake, double totalExercise) {
        String status;
        if (totalIntake == 0 && totalExercise == 0) {
            status = "今天还没有记录任何饮食或运动";
        } else if (deficit >= targetDeficit) {
            status = String.format("今日热量缺口 %.0f 大卡，达到目标缺口 %.0f 大卡", deficit, targetDeficit);
        } else if (deficit > 0) {
            status = String.format("今日热量缺口 %.0f 大卡，未达目标缺口 %.0f 大卡", deficit, targetDeficit);
        } else {
            status = String.format("今日摄入超标，热量超出 %.0f 大卡", Math.abs(deficit));
        }
        return status + String.format("（摄入 %.0f 大卡，运动消耗 %.0f 大卡）", totalIntake, totalExercise);
    }

    private String fallback(double deficit, double targetDeficit) {
        if (deficit >= targetDeficit) return "太棒了！今天的热量缺口达标，继续保持！";
        if (deficit > 0)             return "今天做得不错，明天继续努力，目标就在前方！";
        return "今天摄入有点多，明天调整一下饮食，一定没问题的！";
    }
}
