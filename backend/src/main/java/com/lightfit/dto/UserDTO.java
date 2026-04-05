package com.lightfit.dto;

import lombok.Data;

public class UserDTO {

    @Data
    public static class ProfileRequest {
        private String gender;
        private Double height;
        private Double weight;
        private Integer age;
        private Double activityLevel;
        private Integer targetDeficit;
    }

    @Data
    public static class ProfileResponse {
        private String id;
        private String phone;
        private String gender;
        private Double height;
        private Double weight;
        private Integer age;
        private Double activityLevel;
        private Integer targetDeficit;
        private Double bmr;
        private boolean profileComplete;
    }
}
