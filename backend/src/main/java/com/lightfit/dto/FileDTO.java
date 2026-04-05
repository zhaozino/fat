package com.lightfit.dto;

import lombok.Data;

public class FileDTO {

    @Data
    public static class UploadTokenResponse {
        private String tmpSecretId;
        private String tmpSecretKey;
        private String sessionToken;
        private long   expiredTime;   // Unix 时间戳（秒）
        private String bucket;
        private String region;
        private String keyPrefix;     // 建议的对象键前缀，如 lightfit/{userId}/2026-04-02/
    }
}
