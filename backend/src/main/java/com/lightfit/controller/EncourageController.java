package com.lightfit.controller;

import com.lightfit.agent.EncourageAgent;
import com.lightfit.repository.DailyRecordRepository;
import com.lightfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/encourage")
@RequiredArgsConstructor
public class EncourageController {

    private final EncourageAgent encourageAgent;
    private final DailyRecordRepository dailyRecordRepo;
    private final UserRepository userRepo;

    /**
     * GET /api/encourage
     * 返回今日个性化鼓励消息
     */
    @GetMapping
    public ResponseEntity<Map<String, String>> encourage(Authentication auth) {
        String userId = auth.getName();
        String today  = LocalDate.now().toString();

        double deficit        = 0;
        double totalIntake    = 0;
        double totalExercise  = 0;
        double targetDeficit  = 400;

        var record = dailyRecordRepo.findByUserIdAndRecordDate(userId, today);
        if (record.isPresent()) {
            totalIntake   = record.get().getTotalIntake();
            totalExercise = record.get().getTotalExercise();
            deficit       = record.get().getDeficit();
        }

        var user = userRepo.findById(userId);
        if (user.isPresent() && user.get().getTargetDeficit() != null) {
            targetDeficit = user.get().getTargetDeficit();
        }

        String msg = encourageAgent.encourage(userId, deficit, targetDeficit,
                totalIntake, totalExercise);
        return ResponseEntity.ok(Map.of("message", msg));
    }
}
