package com.lightfit.service;

import com.alibaba.dashscope.embeddings.TextEmbedding;
import com.alibaba.dashscope.embeddings.TextEmbeddingParam;
import com.alibaba.dashscope.embeddings.TextEmbeddingResult;
import com.lightfit.config.DashScopeConfig;
import com.lightfit.dto.ParseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MemoryService — 双层记忆体系
 *
 * 短期记忆：ConcurrentHashMap，key = userId:date，存当日对话列表
 *           超过 MAX_SHORT_TERM 条时对旧消息做摘要压缩
 *
 * 长期记忆：DashScope text-embedding-v3 生成向量，
 *           存入内存向量库（生产环境替换为阿里云向量数据库）
 *           检索时余弦相似度 Top-K
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryService {

    private final DashScopeConfig dashScopeConfig;

    private static final int MAX_SHORT_TERM = 20;
    private static final int TOP_K = 5;

    // ── 短期记忆 ─────────────────────────────────────────────────────────────
    // key: "userId:YYYY-MM-DD"
    private final ConcurrentHashMap<String, List<Map<String, String>>> shortTermStore
            = new ConcurrentHashMap<>();

    public void addShortTerm(String userId, String role, String content) {
        String key = userId + ":" + LocalDate.now();
        List<Map<String, String>> history = shortTermStore
                .computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()));
        history.add(Map.of("role", role, "content", content));

        // 超过上限时，压缩前半部分为一条摘要
        if (history.size() > MAX_SHORT_TERM) {
            List<Map<String, String>> old = new ArrayList<>(history.subList(0, MAX_SHORT_TERM / 2));
            history.subList(0, MAX_SHORT_TERM / 2).clear();
            StringBuilder summary = new StringBuilder("[历史摘要] ");
            old.forEach(m -> summary.append(m.get("role")).append(":").append(m.get("content")).append("; "));
            history.add(0, Map.of("role", "system", "content", summary.toString()));
        }
    }

    public List<Map<String, String>> getShortTerm(String userId) {
        String key = userId + ":" + LocalDate.now();
        return shortTermStore.getOrDefault(key, Collections.emptyList());
    }

    // ── 长期记忆 ─────────────────────────────────────────────────────────────
    // 简单内存向量库：生产环境替换为阿里云向量数据库
    private final List<MemoryEntry> longTermStore = Collections.synchronizedList(new ArrayList<>());

    @Async
    public void saveToLongTermAsync(String userId, ParseDTO.ParseResponse parseResp) {
        try {
            String text = parseResp.getType() + ":" + parseResp.getName()
                    + " " + parseResp.getCalories() + "kcal";
            double[] vector = embed(text);
            longTermStore.add(new MemoryEntry(userId, text, vector, parseResp.getType()));
            // 每个用户最多保留 200 条
            longTermStore.removeIf(e -> e.userId().equals(userId)
                    && longTermStore.stream().filter(x -> x.userId().equals(userId)).count() > 200);
        } catch (Exception e) {
            log.warn("长期记忆写入失败: {}", e.getMessage());
        }
    }

    /**
     * 检索长期记忆，返回与当前输入最相关的 Top-K 条拼接文本
     */
    public String retrieveContext(String userId, String query) {
        try {
            List<MemoryEntry> userEntries = longTermStore.stream()
                    .filter(e -> e.userId().equals(userId))
                    .toList();
            if (userEntries.isEmpty()) return "";

            double[] queryVec = embed(query);
            return userEntries.stream()
                    .sorted((a, b) -> Double.compare(
                            cosineSimilarity(b.vector(), queryVec),
                            cosineSimilarity(a.vector(), queryVec)))
                    .limit(TOP_K)
                    .map(MemoryEntry::content)
                    .reduce((a, b) -> a + "；" + b)
                    .orElse("");
        } catch (Exception e) {
            log.warn("长期记忆检索失败: {}", e.getMessage());
            return "";
        }
    }

    // ── 向量化 ────────────────────────────────────────────────────────────────

    private double[] embed(String text) throws Exception {
        TextEmbedding embedding = new TextEmbedding();
        TextEmbeddingParam param = TextEmbeddingParam.builder()
                .apiKey(dashScopeConfig.getApiKey())
                .model(dashScopeConfig.getEmbeddingModel())
                .texts(Collections.singletonList(text))
                .build();
        TextEmbeddingResult result = embedding.call(param);
        List<Double> vec = result.getOutput().getEmbeddings().get(0).getEmbedding();
        return vec.stream().mapToDouble(Double::doubleValue).toArray();
    }

    private double cosineSimilarity(double[] a, double[] b) {
        double dot = 0, normA = 0, normB = 0;
        int len = Math.min(a.length, b.length);
        for (int i = 0; i < len; i++) {
            dot   += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return (normA == 0 || normB == 0) ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // ── 记录结构 ──────────────────────────────────────────────────────────────
    private record MemoryEntry(String userId, String content, double[] vector, String type) {}
}
