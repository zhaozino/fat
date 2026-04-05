package com.lightfit.repository;

import com.lightfit.domain.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DailyRecordRepository extends JpaRepository<DailyRecord, Long> {
    Optional<DailyRecord> findByUserIdAndRecordDate(String userId, String recordDate);
    List<DailyRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(
            String userId, String startDate, String endDate);
}
