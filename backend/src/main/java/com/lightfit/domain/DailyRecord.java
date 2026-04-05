package com.lightfit.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "daily_record",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "record_date"}))
public class DailyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "record_date", nullable = false)
    private String recordDate;   // YYYY-MM-DD

    @Column(name = "total_intake")
    private Double totalIntake = 0.0;

    @Column(name = "total_exercise")
    private Double totalExercise = 0.0;

    private Double deficit = 0.0;

    @Column(name = "updated_at", nullable = false)
    private String updatedAt;
}
