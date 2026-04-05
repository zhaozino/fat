package com.lightfit.controller;

import com.lightfit.dto.RecordDTO;
import com.lightfit.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/record")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    // 保存一条摄入或运动记录
    @PostMapping
    public ResponseEntity<RecordDTO.DailyRecordResponse> save(
            Authentication auth,
            @RequestBody RecordDTO.SaveItemRequest req) {
        return ResponseEntity.ok(recordService.saveItem(auth.getName(), req));
    }

    // 获取指定日期的完整记录（默认今天）
    @GetMapping
    public ResponseEntity<RecordDTO.DailyRecordResponse> getByDate(
            Authentication auth,
            @RequestParam(defaultValue = "") String date) {
        if (date.isBlank()) date = LocalDate.now().toString();
        return ResponseEntity.ok(recordService.getByDate(auth.getName(), date));
    }

    // 删除一条记录
    @DeleteMapping("/{type}/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            Authentication auth,
            @PathVariable String type,
            @PathVariable Long id) {
        recordService.deleteItem(auth.getName(), type, id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
