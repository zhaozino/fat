package com.lightfit.service;

import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.sms.v20210111.SmsClient;
import com.tencentcloudapi.sms.v20210111.models.SendSmsRequest;
import com.tencentcloudapi.sms.v20210111.models.SendSmsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SmsService {

    @Value("${sms.secret-id}") private String secretId;
    @Value("${sms.secret-key}") private String secretKey;
    @Value("${sms.app-id}")     private String appId;
    @Value("${sms.sign-name}")  private String signName;
    @Value("${sms.template-id}") private String templateId;
    @Value("${sms.mock-mode}")  private boolean mockMode;

    // phone → {code, expireAt}
    private final ConcurrentHashMap<String, CodeEntry> codeCache = new ConcurrentHashMap<>();
    // phone → lastSentAt（防刷：60秒内只能发一次）
    private final ConcurrentHashMap<String, Long> rateLimitMap = new ConcurrentHashMap<>();

    private static final long CODE_TTL_MS   = 5 * 60 * 1000L;  // 5 分钟
    private static final long RATE_LIMIT_MS = 60 * 1000L;       // 60 秒

    public String send(String phone) {
        long now = System.currentTimeMillis();
        Long lastSent = rateLimitMap.get(phone);
        if (lastSent != null && now - lastSent < RATE_LIMIT_MS) {
            throw new IllegalStateException("发送过于频繁，请稍后重试");
        }

        String code = String.format("%06d", new Random().nextInt(1_000_000));
        codeCache.put(phone, new CodeEntry(code, now + CODE_TTL_MS));
        rateLimitMap.put(phone, now);

        if (mockMode) {
            log.info("[短信模拟] 手机 {} 验证码：{}", phone, code);
            return code;
        }

        try {
            Credential cred = new Credential(secretId, secretKey);
            SmsClient client = new SmsClient(cred, "ap-guangzhou");
            SendSmsRequest req = new SendSmsRequest();
            req.setSmsSdkAppId(appId);
            req.setSignName(signName);
            req.setTemplateId(templateId);
            req.setTemplateParamSet(new String[]{code, "5"});
            req.setPhoneNumberSet(new String[]{"+86" + phone});
            SendSmsResponse resp = client.SendSms(req);
            log.debug("短信发送结果: {}", resp.getSendStatusSet()[0].getMessage());
            return null;
        } catch (Exception e) {
            codeCache.remove(phone);
            rateLimitMap.remove(phone);
            throw new RuntimeException("短信发送失败：" + e.getMessage(), e);
        }
    }

    public boolean verify(String phone, String code) {
        CodeEntry entry = codeCache.get(phone);
        if (entry == null) return false;
        if (System.currentTimeMillis() > entry.expireAt()) {
            codeCache.remove(phone);
            return false;
        }
        if (!entry.code().equals(code)) return false;
        codeCache.remove(phone);   // 验证成功后立即删除
        return true;
    }

    private record CodeEntry(String code, long expireAt) {}
}
