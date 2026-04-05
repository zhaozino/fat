package com.lightfit.dto;

import lombok.Data;

import java.util.List;

public class RecordDTO {

    @Data
    public static class SaveItemRequest {
        private String type;          // "food" 或 "exercise"
        private String name;          // 食物名 或 运动名
        private Double calories;
        private String displayText;
        private Boolean isEstimated;
        private String mealType;      // breakfast/lunch/dinner/snack（仅食物）
        private String imageUrl;      // 可选，图片地址
    }

    @Data
    public static class DailyRecordResponse {
        private String date;
        private Double totalIntake;
        private Double totalExercise;
        private Double deficit;
        private Double bmr;
        private List<ItemVO> intake;
        private List<ItemVO> exercise;
    }

    @Data
    public static class ItemVO {
        private Long id;
        private String name;
        private Double calories;
        private String displayText;
        private Boolean isEstimated;
        private String createdAt;
        private String imageUrl;   // 仅食物有
        private String mealType;   // 仅食物有
    }
}
