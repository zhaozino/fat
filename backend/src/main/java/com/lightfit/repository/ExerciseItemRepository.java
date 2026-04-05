package com.lightfit.repository;

import com.lightfit.domain.ExerciseItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseItemRepository extends JpaRepository<ExerciseItem, Long> {
    List<ExerciseItem> findByUserIdAndRecordDateOrderByCreatedAtAsc(String userId, String recordDate);
    void deleteByUserIdAndRecordDate(String userId, String recordDate);
}
