package com.lightfit.repository;

import com.lightfit.domain.IntakeItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IntakeItemRepository extends JpaRepository<IntakeItem, Long> {
    List<IntakeItem> findByUserIdAndRecordDateOrderByCreatedAtAsc(String userId, String recordDate);
    void deleteByUserIdAndRecordDate(String userId, String recordDate);
}
