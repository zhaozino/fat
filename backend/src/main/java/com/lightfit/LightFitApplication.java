package com.lightfit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync   // 开启异步，供 MemoryService 长期记忆写入使用
public class LightFitApplication {
    public static void main(String[] args) {
        SpringApplication.run(LightFitApplication.class, args);
    }
}
