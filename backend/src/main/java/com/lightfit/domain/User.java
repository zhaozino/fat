package com.lightfit.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "user")
public class User {

    @Id
    private String id;          // 手机号

    @Column(nullable = false, unique = true)
    private String phone;

    private String gender;
    private Double height;
    private Double weight;
    private Integer age;

    @Column(name = "activity_level")
    private Double activityLevel = 1.55;

    @Column(name = "target_deficit")
    private Integer targetDeficit = 400;

    private Double bmr;

    @Column(name = "created_at", nullable = false)
    private String createdAt;

    @Column(name = "updated_at", nullable = false)
    private String updatedAt;
}
