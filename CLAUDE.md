# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code 在此代码库工作时提供指导说明。

**请始终使用简体中文与我对话，并在回答时保持专业、简洁。**

## 项目概述

**轻享瘦** 是一款中文热量缺口管理应用，帮助用户追踪每日饮食摄入和运动消耗、计算热量缺口，辅助管理减重目标。

## 项目结构

- **frontend/** — uni-app 前端（Vue 3），可编译到 H5 和微信小程序
- **backend/** — Spring Boot 3 后端（MySQL + JPA）
- **k8s/** — K3s 部署清单（MySQL + backend Deployment/Service）
- **light-fit.html** — **样式设计基准**（单文件内联 HTML/CSS/JS 原型）
- **docs/** — 设计与规格文档

## 运行方式

### 前端（H5 开发）
```bash
cd frontend
UNI_INPUT_DIR=. npm run dev:h5
# 访问 http://localhost:5173
```

### 前端（小程序开发）
```bash
cd frontend
UNI_INPUT_DIR=. npm run dev:mp-weixin
# 用微信开发者工具导入 frontend/dist/dev/mp-weixin
```

### 后端
本地构建 jar → 本机 Docker 打包 → 导入 K3s containerd。详见 memory 中的「轻享瘦后端部署」条目。

## 样式基准

**light-fit.html** 是 UI 视觉设计源文件（内联 CSS/JS 的单文件 H5 原型），uni-app 前端的样式需对齐到这个文件。修改前端样式前，先查阅 light-fit.html 中对应页面/组件的样式；如果两端不一致，改 uni-app 以贴近 light-fit.html，而不是反过来。

## 跨平台注意事项（uni-app）

前端需同时支持 H5 和微信小程序，因此不能使用小程序不支持的 Web API：
- **不使用 `v-html`**（小程序不支持）— SVG 改用 canvas，图标改用 PNG `<image>`
- **不使用内联 SVG 元素** — 用 `<canvas>` + `uni.createCanvasContext` 绘制
- **`position: sticky`** 小程序基础库 2.8.0+ 支持，可以使用

## 核心数据模型

```javascript
// 用户档案
{
  gender: 'male' | 'female',
  height: number,        // 厘米
  weight: number,        // 千克
  age: number,
  activityLevel: number, // 1.2 / 1.375 / 1.55 / 1.725 / 1.9
  targetDeficit: number, // 大卡，默认 400
  bmr: number,
  tdee: number
}

// 每日记录（按 YYYY-MM-DD 为键）
{
  intake: [{food, calories, time, displayText}],
  exercise: [{activity, calories, time, displayText}],
  totalIntake: number,
  totalExercise: number,
  deficit: number        // = tdee + totalExercise - totalIntake
}
```

## 热量缺口计算

`deficit = TDEE + 运动消耗 - 摄入热量`

缺口为正表示处于能量亏缺（有利于减重），为负表示摄入超标。

连续达标阈值：实际缺口 ≥ 目标缺口 × 80%。

减重估算：按 7700 kcal/kg 折算。
