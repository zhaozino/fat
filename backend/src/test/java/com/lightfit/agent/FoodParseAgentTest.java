package com.lightfit.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lightfit.config.DashScopeConfig;
import com.lightfit.dto.ParseDTO;
import com.lightfit.service.MemoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * 集成测试：验证 FoodParseAgent 是否真正调用千问大模型解析热量
 * 需要有效的 DASHSCOPE_API_KEY 环境变量或使用 application.yml 中的默认值
 */
class FoodParseAgentTest {

    private FoodParseAgent agent;
    private MemoryService memoryService;

    @BeforeEach
    void setUp() {
        DashScopeConfig config = new DashScopeConfig();
        // 通过反射设置配置值（避免启动 Spring 上下文）
        setField(config, "apiKey", System.getenv().getOrDefault("DASHSCOPE_API_KEY", "sk-358f0cec9bae4b39a4eea188e860d7ef"));
        setField(config, "model", "qwen3-max");
        setField(config, "vlModel", "qwen-vl-max");
        setField(config, "embeddingModel", "text-embedding-v3");

        memoryService = mock(MemoryService.class);
        when(memoryService.retrieveContext(anyString(), anyString())).thenReturn("");

        agent = new FoodParseAgent(config, memoryService, new ObjectMapper());
    }

    @Test
    void testParseWatermelon5Jin() {
        ParseDTO.ParseResponse resp = agent.parse("test-user", "我吃了5斤西瓜", null);

        System.out.println("===== 千问解析结果 =====");
        System.out.println("type:        " + resp.getType());
        System.out.println("name:        " + resp.getName());
        System.out.println("calories:    " + resp.getCalories());
        System.out.println("displayText: " + resp.getDisplayText());
        System.out.println("isEstimated: " + resp.getIsEstimated());
        System.out.println("========================");

        // 基本断言：应该识别为食物
        assertEquals("food", resp.getType(), "应识别为食物类型");
        assertNotNull(resp.getName(), "名称不应为空");

        // 5斤=2.5kg 西瓜，每100g约30大卡，2500g约750大卡
        // 如果走了 fallback 会返回固定 200 大卡
        // 千问应该返回一个远大于 200 的值
        assertTrue(resp.getCalories() > 300,
                "5斤西瓜热量应远大于300大卡（fallback默认200），实际=" + resp.getCalories());
        assertTrue(resp.getCalories() < 2000,
                "5斤西瓜热量不应超过2000大卡，实际=" + resp.getCalories());
    }

    @Test
    void testParseRiceBowl() {
        ParseDTO.ParseResponse resp = agent.parse("test-user", "吃了一碗米饭", null);

        System.out.println("===== 千问解析结果（一碗米饭） =====");
        System.out.println("type:        " + resp.getType());
        System.out.println("name:        " + resp.getName());
        System.out.println("calories:    " + resp.getCalories());
        System.out.println("displayText: " + resp.getDisplayText());
        System.out.println("isEstimated: " + resp.getIsEstimated());
        System.out.println("====================================");

        assertEquals("food", resp.getType());
        // 一碗米饭约 200-300 大卡，千问如果真正解析应返回这个范围
        // fallback 也是 200，但千问通常会返回 230-260
        assertTrue(resp.getCalories() >= 150 && resp.getCalories() <= 400,
                "一碗米饭热量应在150-400大卡范围，实际=" + resp.getCalories());
    }

    @Test
    void testParseBoiledEgg() {
        ParseDTO.ParseResponse resp = agent.parse("test-user", "吃了一个水煮蛋", null);

        System.out.println("===== 千问解析结果（水煮蛋） =====");
        System.out.println("type:        " + resp.getType());
        System.out.println("name:        " + resp.getName());
        System.out.println("calories:    " + resp.getCalories());
        System.out.println("displayText: " + resp.getDisplayText());
        System.out.println("isEstimated: " + resp.getIsEstimated());
        System.out.println("==================================");

        assertEquals("food", resp.getType());
        // 一个水煮蛋约50g，每100g约144大卡，一个约70-80大卡
        assertTrue(resp.getCalories() >= 50 && resp.getCalories() <= 100,
                "一个水煮蛋热量应在50-100大卡范围，实际=" + resp.getCalories());
    }

    private void setField(Object obj, String fieldName, String value) {
        try {
            var field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(obj, value);
        } catch (Exception e) {
            throw new RuntimeException("设置字段失败: " + fieldName, e);
        }
    }
}
