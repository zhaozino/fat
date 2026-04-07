package com.lightfit.controller;

import com.lightfit.domain.Feedback;
import com.lightfit.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "反馈内容不能为空"));
        }

        Feedback feedback = new Feedback();
        feedback.setUserId(auth.getName());
        feedback.setContent(content.trim());
        feedback.setCreatedAt(LocalDateTime.now().format(DTF));
        feedbackRepository.save(feedback);

        return ResponseEntity.ok(Map.of("success", true, "message", "感谢您的反馈！"));
    }
}
