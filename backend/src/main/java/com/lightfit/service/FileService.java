package com.lightfit.service;

import com.lightfit.config.CosConfig;
import com.lightfit.dto.FileDTO;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.http.HttpMethodName;
import com.tencent.cloud.CosStsClient;
import com.tencent.cloud.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.LocalDate;
import java.util.Date;
import java.util.TreeMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final CosConfig cosConfig;
    private final COSClient cosClient;

    @Value("${cos.secret-id}")  private String secretId;
    @Value("${cos.secret-key}") private String secretKey;
    @Value("${cos.sts-duration:1800}") private int stsDuration;

    /**
     * 生成预签名上传 URL
     * 前端直接用 PUT 请求上传，无需计算签名
     */
    public FileDTO.PresignedUrlResponse generatePresignedUrl(String userId, String ext) {
        if (ext == null || ext.isEmpty()) {
            ext = "jpg";
        }
        String key = String.format("lightfit/%s/%s/%d.%s", userId, LocalDate.now(), System.currentTimeMillis(), ext);

        Date expiration = new Date(System.currentTimeMillis() + stsDuration * 1000L);
        URL presignedUrl = cosClient.generatePresignedUrl(cosConfig.getBucket(), key, expiration, HttpMethodName.PUT);

        FileDTO.PresignedUrlResponse resp = new FileDTO.PresignedUrlResponse();
        resp.setUploadUrl(presignedUrl.toString());
        resp.setFileUrl(String.format("https://%s.cos.%s.myqcloud.com/%s", cosConfig.getBucket(), cosConfig.getRegion(), key));
        return resp;
    }

    /**
     * 生成腾讯云 COS STS 临时上传凭证
     * 前端用该凭证直传图片，不经过后端服务器
     */
    public FileDTO.UploadTokenResponse generateUploadToken(String userId) {
        String keyPrefix = String.format("lightfit/%s/%s/", userId, LocalDate.now());

        try {
            TreeMap<String, Object> config = new TreeMap<>();
            config.put("SecretId",  secretId);
            config.put("SecretKey", secretKey);
            config.put("DurationSeconds", stsDuration);
            config.put("Bucket",  cosConfig.getBucket());
            config.put("Region",  cosConfig.getRegion());
            config.put("AllowPrefix", keyPrefix + "*");
            String[] allowActions = {
                "name/cos:PutObject",
                "name/cos:InitiateMultipartUpload",
                "name/cos:ListMultipartUploads",
                "name/cos:ListParts",
                "name/cos:UploadPart",
                "name/cos:CompleteMultipartUpload"
            };
            config.put("AllowActions", allowActions);

            Response sts = CosStsClient.getCredential(config);

            FileDTO.UploadTokenResponse resp = new FileDTO.UploadTokenResponse();
            resp.setTmpSecretId(sts.credentials.tmpSecretId);
            resp.setTmpSecretKey(sts.credentials.tmpSecretKey);
            resp.setSessionToken(sts.credentials.sessionToken);
            resp.setExpiredTime(sts.expiredTime);
            resp.setBucket(cosConfig.getBucket());
            resp.setRegion(cosConfig.getRegion());
            resp.setKeyPrefix(keyPrefix);
            return resp;

        } catch (Exception e) {
            throw new RuntimeException("获取 COS 临时凭证失败：" + e.getMessage(), e);
        }
    }
}
