package com.lightfit.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "intake_item")
public class IntakeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "record_date", nullable = false)
    private String recordDate;

    @Column(nullable = false)
    private String food;

    @Column(nullable = false)
    private Double calories;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "display_text")
    private String displayText;

    @Column(name = "is_estimated")
    private Boolean isEstimated = false;

    @Column(name = "meal_type")
    private String mealType;    // breakfast/lunch/dinner/snack

    @Column(name = "created_at", nullable = false)
    private String createdAt;
}
