package com.lightfit.config;

import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.region.Region;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CosConfig {

    @Value("${cos.secret-id}")  private String secretId;
    @Value("${cos.secret-key}") private String secretKey;
    @Value("${cos.region}")     private String region;
    @Value("${cos.bucket}")     private String bucket;

    public String getBucket() { return bucket; }
    public String getRegion()  { return region; }

    @Bean
    public COSClient cosClient() {
        return new COSClient(
                new BasicCOSCredentials(secretId, secretKey),
                new ClientConfig(new Region(region))
        );
    }
}
