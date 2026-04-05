package com.lightfit.service;

import com.lightfit.domain.DailyRecord;
import com.lightfit.domain.ExerciseItem;
import com.lightfit.domain.IntakeItem;
import com.lightfit.domain.User;
import com.lightfit.dto.RecordDTO;
import com.lightfit.repository.DailyRecordRepository;
import com.lightfit.repository.ExerciseItemRepository;
import com.lightfit.repository.IntakeItemRepository;
import com.lightfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final IntakeItemRepository intakeRepo;
    private final ExerciseItemRepository exerciseRepo;
    private final DailyRecordRepository dailyRepo;
    private final UserRepository userRepo;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public RecordDTO.DailyRecordResponse saveItem(String userId, RecordDTO.SaveItemRequest req) {
        String today = LocalDate.now().toString();
        String now = LocalDateTime.now().format(DTF);

        if ("food".equals(req.getType())) {
            IntakeItem item = new IntakeItem();
            item.setUserId(userId);
            item.setRecordDate(today);
            item.setFood(req.getName());
            item.setCalories(req.getCalories());
            item.setDisplayText(req.getDisplayText());
            item.setIsEstimated(Boolean.TRUE.equals(req.getIsEstimated()));
            item.setMealType(req.getMealType());
            item.setImageUrl(req.getImageUrl());
            item.setCreatedAt(now);
            intakeRepo.save(item);
        } else {
            ExerciseItem item = new ExerciseItem();
            item.setUserId(userId);
            item.setRecordDate(today);
            item.setActivity(req.getName());
            item.setCalories(req.getCalories());
            item.setDisplayText(req.getDisplayText());
            item.setIsEstimated(Boolean.TRUE.equals(req.getIsEstimated()));
            item.setCreatedAt(now);
            exerciseRepo.save(item);
        }

        return buildDailyResponse(userId, today);
    }

    @Transactional
    public void deleteItem(String userId, String type, Long itemId) {
        if ("food".equals(type)) {
            IntakeItem item = intakeRepo.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("记录不存在"));
            if (!item.getUserId().equals(userId)) throw new SecurityException("无权操作");
            intakeRepo.delete(item);
            recalcDaily(userId, item.getRecordDate());
        } else {
            ExerciseItem item = exerciseRepo.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("记录不存在"));
            if (!item.getUserId().equals(userId)) throw new SecurityException("无权操作");
            exerciseRepo.delete(item);
            recalcDaily(userId, item.getRecordDate());
        }
    }

    public RecordDTO.DailyRecordResponse getByDate(String userId, String date) {
        return buildDailyResponse(userId, date);
    }

    private RecordDTO.DailyRecordResponse buildDailyResponse(String userId, String date) {
        List<IntakeItem> intakeItems = intakeRepo
                .findByUserIdAndRecordDateOrderByCreatedAtAsc(userId, date);
        List<ExerciseItem> exerciseItems = exerciseRepo
                .findByUserIdAndRecordDateOrderByCreatedAtAsc(userId, date);

        double totalIntake   = intakeItems.stream().mapToDouble(IntakeItem::getCalories).sum();
        double totalExercise = exerciseItems.stream().mapToDouble(ExerciseItem::getCalories).sum();

        User user = userRepo.findById(userId).orElseThrow();
        double bmr     = user.getBmr() != null ? user.getBmr() : 0;
        double deficit = bmr + totalExercise - totalIntake;

        // 更新汇总记录
        recalcAndSaveDaily(userId, date, totalIntake, totalExercise, deficit);

        RecordDTO.DailyRecordResponse resp = new RecordDTO.DailyRecordResponse();
        resp.setDate(date);
        resp.setTotalIntake(totalIntake);
        resp.setTotalExercise(totalExercise);
        resp.setDeficit(deficit);
        resp.setBmr(bmr);
        resp.setIntake(intakeItems.stream().map(this::toItemVO).toList());
        resp.setExercise(exerciseItems.stream().map(this::toItemVO).toList());
        return resp;
    }

    private void recalcDaily(String userId, String date) {
        List<IntakeItem> intakes   = intakeRepo.findByUserIdAndRecordDateOrderByCreatedAtAsc(userId, date);
        List<ExerciseItem> exercises = exerciseRepo.findByUserIdAndRecordDateOrderByCreatedAtAsc(userId, date);
        double totalIntake   = intakes.stream().mapToDouble(IntakeItem::getCalories).sum();
        double totalExercise = exercises.stream().mapToDouble(ExerciseItem::getCalories).sum();
        User user = userRepo.findById(userId).orElseThrow();
        double bmr = user.getBmr() != null ? user.getBmr() : 0;
        recalcAndSaveDaily(userId, date, totalIntake, totalExercise, bmr + totalExercise - totalIntake);
    }

    private void recalcAndSaveDaily(String userId, String date,
                                    double totalIntake, double totalExercise, double deficit) {
        DailyRecord daily = dailyRepo.findByUserIdAndRecordDate(userId, date)
                .orElseGet(() -> {
                    DailyRecord d = new DailyRecord();
                    d.setUserId(userId);
                    d.setRecordDate(date);
                    return d;
                });
        daily.setTotalIntake(totalIntake);
        daily.setTotalExercise(totalExercise);
        daily.setDeficit(deficit);
        daily.setUpdatedAt(LocalDateTime.now().format(DTF));
        dailyRepo.save(daily);
    }

    private RecordDTO.ItemVO toItemVO(IntakeItem item) {
        RecordDTO.ItemVO vo = new RecordDTO.ItemVO();
        vo.setId(item.getId());
        vo.setName(item.getFood());
        vo.setCalories(item.getCalories());
        vo.setDisplayText(item.getDisplayText());
        vo.setIsEstimated(item.getIsEstimated());
        vo.setCreatedAt(item.getCreatedAt());
        vo.setImageUrl(item.getImageUrl());
        vo.setMealType(item.getMealType());
        return vo;
    }

    private RecordDTO.ItemVO toItemVO(ExerciseItem item) {
        RecordDTO.ItemVO vo = new RecordDTO.ItemVO();
        vo.setId(item.getId());
        vo.setName(item.getActivity());
        vo.setCalories(item.getCalories());
        vo.setDisplayText(item.getDisplayText());
        vo.setIsEstimated(item.getIsEstimated());
        vo.setCreatedAt(item.getCreatedAt());
        return vo;
    }
}
