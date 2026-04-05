package com.lightfit.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "exercise_item")
public class ExerciseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "record_date", nullable = false)
    private String recordDate;

    @Column(nullable = false)
    private String activity;

    @Column(nullable = false)
    private Double calories;

    @Column(name = "display_text")
    private String displayText;

    @Column(name = "is_estimated")
    private Boolean isEstimated = false;

    @Column(name = "created_at", nullable = false)
    private String createdAt;
}
