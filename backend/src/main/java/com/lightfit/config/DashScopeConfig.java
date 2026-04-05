package com.lightfit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * 阿里云 DashScope 配置
 * API Key 从环境变量 DASHSCOPE_API_KEY 读取
 */
@Configuration
public class DashScopeConfig {

    @Value("${dashscope.api-key}")
    private String apiKey;

    @Value("${dashscope.model:qwen-max}")
    private String model;

    @Value("${dashscope.vl-model:qwen-vl-max}")
    private String vlModel;

    @Value("${dashscope.embedding-model:text-embedding-v3}")
    private String embeddingModel;

    public String getApiKey()        { return apiKey; }
    public String getModel()         { return model; }
    public String getVlModel()       { return vlModel; }
    public String getEmbeddingModel(){ return embeddingModel; }
}
