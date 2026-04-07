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

    @Data
    public static class PresignedUrlResponse {
        private String uploadUrl;     // 预签名上传 URL
        private String fileUrl;       // 上传成功后的访问 URL
    }
}
