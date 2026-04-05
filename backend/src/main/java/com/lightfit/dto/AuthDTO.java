package com.lightfit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public class AuthDTO {

    @Data
    public static class SendSmsRequest {
        @NotBlank
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式错误")
        private String phone;
    }

    @Data
    public static class VerifyRequest {
        @NotBlank
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式错误")
        private String phone;

        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "验证码必须是6位数字")
        private String code;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private boolean isNewUser;
        private String userId;

        public AuthResponse(String token, boolean isNewUser, String userId) {
            this.token = token;
            this.isNewUser = isNewUser;
            this.userId = userId;
        }
    }
}
