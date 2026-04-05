package com.lightfit.dto;

import lombok.Data;

public class ParseDTO {

    @Data
    public static class ParseRequest {
        private String text;        // 用户自然语言输入，可为空（纯图片时）
        private String imageUrl;    // COS 图片地址，可为空（纯文字时）
        private String mealType;    // breakfast/lunch/dinner/snack（可选）
    }

    @Data
    public static class ParseResponse {
        private String type;          // "food" 或 "exercise"
        private String name;          // 识别出的食物/运动名称
        private Double calories;      // 热量（大卡）
        private String displayText;   // 展示给用户的描述
        private Boolean isEstimated;  // 是否为估算值
    }
}
