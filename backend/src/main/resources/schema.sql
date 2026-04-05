-- 用户表（user 是 MySQL 保留字，需反引号）
CREATE TABLE IF NOT EXISTS `user` (
    id              VARCHAR(20) PRIMARY KEY,    -- 手机号作为唯一标识
    phone           VARCHAR(20) NOT NULL UNIQUE,
    gender          VARCHAR(10),
    height          DOUBLE,
    weight          DOUBLE,
    age             INT,
    activity_level  DOUBLE DEFAULT 1.55,
    target_deficit  INT DEFAULT 400,
    bmr             DOUBLE,
    created_at      VARCHAR(30) NOT NULL,
    updated_at      VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 每日记录汇总表
CREATE TABLE IF NOT EXISTS daily_record (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         VARCHAR(20) NOT NULL,
    record_date     VARCHAR(10) NOT NULL,       -- YYYY-MM-DD
    total_intake    DOUBLE DEFAULT 0,
    total_exercise  DOUBLE DEFAULT 0,
    deficit         DOUBLE DEFAULT 0,
    updated_at      VARCHAR(30) NOT NULL,
    UNIQUE KEY uk_user_date (user_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 摄入明细表
CREATE TABLE IF NOT EXISTS intake_item (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         VARCHAR(20) NOT NULL,
    record_date     VARCHAR(10) NOT NULL,
    food            VARCHAR(200) NOT NULL,
    calories        DOUBLE NOT NULL,
    image_url       VARCHAR(500),
    display_text    VARCHAR(500),
    is_estimated    TINYINT DEFAULT 0,
    meal_type       VARCHAR(20),                -- breakfast/lunch/dinner/snack
    created_at      VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 运动明细表
CREATE TABLE IF NOT EXISTS exercise_item (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         VARCHAR(20) NOT NULL,
    record_date     VARCHAR(10) NOT NULL,
    activity        VARCHAR(200) NOT NULL,
    calories        DOUBLE NOT NULL,
    display_text    VARCHAR(500),
    is_estimated    TINYINT DEFAULT 0,
    created_at      VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
