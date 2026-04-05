# 轻享瘦 · 技术架构文档

> 版本：1.0 · 日期：2026-04-02

---

## 一、系统总览

**轻享瘦**是一款热量缺口管理应用，帮助用户通过自然语言记录饮食与运动，计算热量缺口，辅助减重目标管理。

### 整体技术栈

| 层级 | 技术选型 |
|---|---|
| 前端 | UniApp + Vue 3 + Vite（微信小程序） |
| 后端 | Spring Boot 3.x |
| 数据库 | SQLite（本地持久化） |
| 文件存储 | 腾讯云 COS |
| AI 框架 | AgentScope-Java |
| 大模型 | 阿里云通义千问（Qwen） |
| 短期记忆 | JVM 内存（本地缓存） |
| 长期记忆 | 阿里云向量数据库（Dashscope Embedding + 阿里云 VectorStore） |

---

## 二、前端架构（UniApp Vue 3）

### 2.1 目录结构

```
frontend/
├── src/
│   ├── pages/
│   │   ├── home/           # 首页（今日热量缺口环形图）
│   │   ├── record/         # 记录页（自然语言输入 + 拍照）
│   │   ├── stats/          # 统计页（趋势图、历史记录）
│   │   └── profile/        # 我的（个人信息、BMR 设置）
│   ├── components/
│   │   ├── DeficitCircle.vue    # 热量缺口环形图组件
│   │   ├── ChatInput.vue        # 聊天式输入框组件
│   │   ├── RecordItem.vue       # 单条记录展示组件
│   │   └── TrendChart.vue       # 折线趋势图组件
│   ├── api/
│   │   ├── request.js           # 统一请求封装（uni.request）
│   │   ├── record.js            # 记录相关接口
│   │   ├── user.js              # 用户相关接口
│   │   └── stats.js             # 统计相关接口
│   ├── store/
│   │   └── index.js             # Pinia 状态管理
│   ├── utils/
│   │   ├── calculator.js        # BMR/缺口计算（复用原有逻辑）
│   │   └── date.js              # 日期格式化工具
│   └── App.vue
├── manifest.json
├── pages.json                   # 页面路由配置
└── vite.config.js
```

### 2.2 页面功能说明

| 页面 | 路由 | 核心功能 |
|---|---|---|
| 首页 | `/pages/home/index` | 今日缺口环形图、摄入/运动/基础代谢统计、AI 鼓励消息、快速记录入口 |
| 记录页 | `/pages/record/index` | 自然语言输入、相机拍照识别食物、消息气泡展示、实时解析结果 |
| 统计页 | `/pages/stats/index` | 周/月趋势折线图、平均缺口、连续达标天数、预估减重、历史日期列表 |
| 我的 | `/pages/profile/index` | 个人信息表单、BMR 结果展示、数据导出、清除数据 |

### 2.3 拍照上传流程

```
用户点击拍照
  → uni.chooseImage() 调起相机
  → 前端调用 /api/file/upload-token 获取 COS 临时凭证
  → 使用 COS JS SDK 直传图片至腾讯云 COS
  → 返回图片 URL
  → 将 URL 连同用户描述一起提交至 /api/record/parse
  → 后端 AI 解析图片中的食物并返回热量信息
```

### 2.4 状态管理（Pinia）

```javascript
// store/index.js 核心状态
{
  user: { gender, height, weight, age, activityLevel, targetDeficit, bmr },
  todayRecord: { intake: [], exercise: [], totalIntake, totalExercise, deficit },
  streakDays: Number
}
```

---

## 三、后端架构（Spring Boot）

### 3.1 目录结构

```
backend/
├── src/main/java/com/lightfit/
│   ├── LightFitApplication.java
│   ├── config/
│   │   ├── CosConfig.java           # 腾讯云 COS 配置
│   │   ├── AgentScopeConfig.java    # AgentScope AI 配置
│   │   └── SqliteConfig.java        # SQLite 数据源配置
│   ├── controller/
│   │   ├── UserController.java      # 用户信息接口
│   │   ├── RecordController.java    # 记录接口
│   │   ├── StatsController.java     # 统计接口
│   │   └── FileController.java      # 文件上传接口
│   ├── service/
│   │   ├── UserService.java
│   │   ├── RecordService.java
│   │   ├── StatsService.java
│   │   ├── FileService.java
│   │   └── ai/
│   │       ├── FoodParseAgent.java      # 食物解析 Agent
│   │       ├── EncourageAgent.java      # 鼓励话术 Agent
│   │       └── MemoryService.java       # 记忆管理服务
│   ├── domain/
│   │   ├── User.java
│   │   ├── DailyRecord.java
│   │   ├── IntakeItem.java
│   │   └── ExerciseItem.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── DailyRecordRepository.java
│   │   └── IntakeItemRepository.java
│   └── dto/
│       ├── ParseRequest.java
│       ├── ParseResponse.java
│       └── RecordDTO.java
└── src/main/resources/
    ├── application.yml
    └── schema.sql                   # SQLite 建表脚本
```

### 3.2 核心 API 接口

#### 用户

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/user/{openid}` | 获取用户信息 |
| `POST` | `/api/user` | 创建/更新用户信息 |

#### 记录

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/record/parse` | 自然语言/图片解析，返回食物或运动热量 |
| `POST` | `/api/record` | 保存一条记录（摄入或运动） |
| `GET` | `/api/record/{date}` | 获取指定日期的所有记录 |
| `DELETE` | `/api/record/{id}` | 删除一条记录 |

#### 统计

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/stats/trend?range=week\|month` | 获取缺口趋势数据 |
| `GET` | `/api/stats/summary` | 获取汇总数据（平均缺口、达标天数等） |

#### 文件

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/file/upload-token` | 获取 COS 临时上传凭证（STS） |

### 3.3 数据库模型（SQLite）

```sql
-- 用户表
CREATE TABLE user (
    id          TEXT PRIMARY KEY,   -- 微信 openid
    gender      TEXT,
    height      REAL,
    weight      REAL,
    age         INTEGER,
    activity_level REAL DEFAULT 1.55,
    target_deficit INTEGER DEFAULT 400,
    bmr         REAL,
    created_at  TEXT,
    updated_at  TEXT
);

-- 每日记录汇总表
CREATE TABLE daily_record (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    record_date     TEXT NOT NULL,          -- YYYY-MM-DD
    total_intake    REAL DEFAULT 0,
    total_exercise  REAL DEFAULT 0,
    deficit         REAL DEFAULT 0,
    updated_at      TEXT,
    UNIQUE(user_id, record_date)
);

-- 摄入明细表
CREATE TABLE intake_item (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    record_date  TEXT NOT NULL,
    food         TEXT,
    calories     REAL,
    image_url    TEXT,                      -- COS 图片地址
    display_text TEXT,
    is_estimated INTEGER DEFAULT 0,
    created_at   TEXT
);

-- 运动明细表
CREATE TABLE exercise_item (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    record_date  TEXT NOT NULL,
    activity     TEXT,
    calories     REAL,
    display_text TEXT,
    is_estimated INTEGER DEFAULT 0,
    created_at   TEXT
);
```

---

## 四、AI 模块架构（AgentScope-Java）

### 4.1 整体设计

AI 模块通过 AgentScope-Java 框架构建，包含两个核心 Agent，共享同一套记忆体系：

```
用户输入（文字 / 图片 URL）
        │
        ▼
┌───────────────────┐
│   FoodParseAgent  │  ← 解析食物/运动，返回热量
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  EncourageAgent   │  ← 根据当日缺口生成鼓励消息
└───────────────────┘
        │
   ┌────┴────┐
   │ 记忆体系 │
   └────┬────┘
        │
   ┌────┴──────────────┐
   │  短期记忆（内存）    │  ← 当日对话上下文，JVM 内 ConcurrentHashMap
   │  长期记忆（向量库）  │  ← 用户饮食偏好、历史习惯，阿里向量数据库
   └───────────────────┘
```

### 4.2 FoodParseAgent

**职责**：将用户的自然语言描述或食物图片解析为结构化热量数据。

**处理流程**：
1. 检索长期记忆，获取用户历史饮食偏好（辅助提示词）
2. 若有图片，构造多模态请求（图片 URL + 文字）
3. 调用 Qwen-VL 或 Qwen-Max 推理
4. 解析返回 JSON，提取食物名称、热量、是否估算
5. 将本次记录写入短期记忆（当日上下文）和长期记忆（用户偏好向量）

**System Prompt 片段**：
```
你是一个专业的营养师助手。用户会告诉你吃了什么或做了什么运动，
你需要返回标准 JSON 格式，包含：
- type: "food" 或 "exercise"
- name: 食物/运动名称
- calories: 热量（大卡）
- isEstimated: 是否为估算值（布尔）
- displayText: 展示给用户的简短描述
如果是图片，先识别图中的食物，再估算热量。
```

### 4.3 EncourageAgent

**职责**：根据用户今日热量缺口状态生成个性化鼓励消息。

**处理流程**：
1. 读取短期记忆（今日缺口、摄入、运动情况）
2. 检索长期记忆（用户历史达标规律、偏好的鼓励风格）
3. 构造 Prompt，调用 Qwen-Max
4. 返回不超过 50 字的鼓励文案

### 4.4 记忆体系

#### 短期记忆（JVM 内存）

```java
// 以 userId + date 为 key，存储当日对话上下文
ConcurrentHashMap<String, List<Message>> shortTermMemory;

// 结构示例
key: "user_xxx_2026-04-02"
value: [
  { role: "user",      content: "早饭吃了一碗粥和一个鸡蛋" },
  { role: "assistant", content: "{type:food, name:粥+鸡蛋, calories:280, ...}" },
  { role: "user",      content: "跑步30分钟" },
  { role: "assistant", content: "{type:exercise, name:跑步, calories:300, ...}" }
]
```

- 每日记录超过 **20 条**时，对旧记录做摘要压缩
- 应用重启后短期记忆清空，不持久化

#### 长期记忆（阿里云向量数据库）

```
Collection: lightfit_user_memory

每条记忆文档结构：
{
  id:        UUID,
  userId:    String,
  type:      "food_preference" | "exercise_habit" | "goal_context",
  content:   "用户倾向于早餐吃粥类食物，偏素食",
  vector:    float[1536],      // text-embedding-v3 生成
  createdAt: timestamp,
  metadata:  { date, calories, ... }
}
```

**写入时机**：每次记录保存后，异步生成 embedding 并存入向量库
**检索时机**：Agent 构造 Prompt 前，用当前输入检索 Top-5 相似记忆

### 4.5 AgentScope 配置

```yaml
# application.yml 中 AI 相关配置（值从环境变量读取）

agentscope:
  model:
    provider: dashscope
    model-id: qwen-max
    api-key: ${DASHSCOPE_API_KEY}
    multimodal-model-id: qwen-vl-max    # 图片识别

  vector-store:
    provider: dashscope
    endpoint: ${DASHSCOPE_VECTOR_ENDPOINT}
    api-key: ${DASHSCOPE_API_KEY}
    embedding-model: text-embedding-v3
    collection-name: lightfit_user_memory

cos:
  secret-id: ${COS_SECRET_ID}
  secret-key: ${COS_SECRET_KEY}
  region: ${COS_REGION}
  bucket: ${COS_BUCKET}
  sts-duration: 1800                    # 临时凭证有效期（秒）
```

---

## 五、腾讯云 COS 集成

### 上传方案：前端直传（STS 临时凭证）

```
前端                    后端                   腾讯云
  │──── GET /api/file/upload-token ──→│
  │                                   │──── 请求 STS 临时凭证 ──→ │
  │                                   │←── secretId/Key/Token ─── │
  │←─────── 返回临时凭证 ──────────────│
  │
  │──────────── 直传图片 ─────────────────────────────────────────→ COS
  │←──────────── 返回图片 URL ───────────────────────────────────── COS
  │
  │──── POST /api/record/parse { text, imageUrl } ──→│
  │←──────── 解析结果（食物+热量）────────────────────│
```

**COS 对象路径规则**：
```
lightfit/{userId}/{YYYY-MM-DD}/{timestamp}_{filename}
```

---

## 六、环境变量清单

| 变量名 | 用途 |
|---|---|
| `DASHSCOPE_API_KEY` | 阿里云灵积 API Key（千问大模型 + Embedding） |
| `DASHSCOPE_VECTOR_ENDPOINT` | 阿里云向量数据库接入点 |
| `COS_SECRET_ID` | 腾讯云 COS SecretId |
| `COS_SECRET_KEY` | 腾讯云 COS SecretKey |
| `COS_REGION` | COS 地域，如 `ap-guangzhou` |
| `COS_BUCKET` | COS Bucket 名称 |
| `JWT_SECRET` | JWT 签名密钥（接口鉴权） |
| `WECHAT_APP_ID` | 微信小程序 AppID |
| `WECHAT_APP_SECRET` | 微信小程序 AppSecret |
| `SMS_SECRET_ID` | 腾讯云短信 SecretId |
| `SMS_SECRET_KEY` | 腾讯云短信 SecretKey |
| `SMS_APP_ID` | 腾讯云短信 SdkAppId |
| `SMS_SIGN_NAME` | 短信签名名称 |
| `SMS_TEMPLATE_ID` | 验证码短信模板 ID |

---

## 七、注册与登录流程

### 7.1 短信验证码登录/注册（唯一入口）

系统**只支持手机号 + 短信验证码**方式登录，新用户首次验证通过后自动完成注册。

```
前端                        后端                    腾讯云短信
  │
  │── POST /api/auth/send-sms { phone } ──→│
  │                                        │── 生成6位随机验证码
  │                                        │── 存入内存缓存（TTL 5分钟）
  │                                        │── 调用腾讯云短信 API ──→│
  │                                        │                         │── 下发短信
  │←──── 返回 { success: true } ──────────│
  │
  │── POST /api/auth/verify { phone, code } ──→│
  │                                             │── 校验验证码（比对缓存）
  │                                             │── 查询用户是否存在
  │                                             │   ├─ 不存在 → 自动创建新用户
  │                                             │   └─ 存在   → 直接登录
  │                                             │── 颁发 JWT Token
  │←──── 返回 { token, isNewUser } ────────────│
  │
  │（后续所有请求 Header 携带 Bearer Token）
```

### 7.2 接口定义

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/auth/send-sms` | 发送验证码，Body: `{ phone }` |
| `POST` | `/api/auth/verify` | 校验验证码，Body: `{ phone, code }`，返回 `{ token, isNewUser }` |

### 7.3 后端实现要点

- **验证码存储**：`ConcurrentHashMap<phone, {code, expireAt}>`，TTL 5 分钟，验证后立即删除
- **防刷限制**：同一手机号 60 秒内不允许重复发送（与短信下发的倒计时一致）
- **JWT Payload**：`{ userId, phone, iat, exp }`，有效期 7 天
- **新用户判断**：`isNewUser=true` 时前端引导用户进入个人信息填写页

### 7.4 前端登录 UI 流程

```
启动 App
  └─ 检查本地 Token
      ├─ 有效 → 直接进入主界面
      └─ 无效/无 → 显示登录遮罩页
                    │
                    ├─ 步骤一：输入手机号 → 点击"获取验证码"
                    │           └─ 按钮进入 60s 倒计时，防止重复发送
                    │
                    └─ 步骤二：输入6位验证码 → 点击"登录 / 注册"
                                └─ 成功 → 隐藏遮罩，初始化主界面
                                   isNewUser=true → 跳转个人信息页
```

### 7.5 微信小程序端补充

小程序端在短信登录基础上，可额外支持**静默获取 openid** 用于设备绑定，但登录凭证仍以手机号为主：

```
小程序                  后端                    微信服务器
   │── wx.login() ──→ code（静默，无需用户授权）
   │── POST /api/auth/verify { phone, code, wxCode } ──→│
   │                                                     │── code2session ──→│
   │                                                     │←── openid ────────│
   │                                                     │── 绑定 openid 到用户
   │←──── 返回 JWT Token ──────────────────────────────│
```

---

## 八、部署架构

```
┌──────────────────────────────────────────────────────┐
│                     服务器（单机）                      │
│                                                      │
│  ┌─────────────────┐      ┌────────────────────┐    │
│  │  Spring Boot     │      │     SQLite 文件      │    │
│  │  (8080)          │──────│  lightfit.db        │    │
│  │                  │      └────────────────────┘    │
│  │  AgentScope AI   │                                │
│  │  JVM 短期记忆     │                                │
│  └──────┬──────────┘                                │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
    ┌─────┼──────────────────────────────┐
    │     │         外部服务              │
    │     ├──→ 阿里云 Dashscope（千问）   │
    │     ├──→ 阿里云向量数据库           │
    │     └──→ 腾讯云 COS               │
    └────────────────────────────────────┘
```

**推荐配置**：2 核 4G 云服务器，Nginx 反向代理，Spring Boot 打包为 Fat JAR 运行。

---

## 九、开发优先级建议

| 阶段 | 内容 |
|---|---|
| P0（核心功能） | 微信登录、用户信息设置、记录保存、今日首页展示 |
| P1（AI 解析） | FoodParseAgent 文字解析、统计页趋势图 |
| P2（图片功能） | COS 直传、Qwen-VL 图片识别食物 |
| P3（个性化 AI） | EncourageAgent 鼓励消息、长期记忆向量检索 |
