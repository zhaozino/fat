package com.lightfit.controller;

import com.lightfit.agent.FoodParseAgent;
import com.lightfit.dto.ParseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/parse")
@RequiredArgsConstructor
public class ParseController {

    private final FoodParseAgent foodParseAgent;

    /**
     * POST /api/parse
     * 解析用户输入的食物/运动文字或图片，返回结构化热量数据
     */
    @PostMapping
    public ResponseEntity<ParseDTO.ParseResponse> parse(
            Authentication auth,
            @RequestBody ParseDTO.ParseRequest req) {
        ParseDTO.ParseResponse resp = foodParseAgent.parse(
                auth.getName(),
                req.getText(),
                req.getImageUrl()
        );
        return ResponseEntity.ok(resp);
    }
}
