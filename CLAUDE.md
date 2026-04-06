# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code 在此代码库工作时提供指导说明。

**请始终使用简体中文与我对话，并在回答时保持专业、简洁。**

## 项目概述

**轻享瘦** 是一款中文热量缺口管理应用，帮助用户追踪每日饮食摄入和运动消耗、计算热量缺口，辅助管理减重目标。

## 项目结构

- **frontend/** — 原生微信小程序前端
- **backend/** — Spring Boot 3 后端（MySQL + JPA）
- **k8s/** — K3s 部署清单（MySQL + backend Deployment/Service）
- **light-fit.html** — **样式设计基准**（单文件内联 HTML/CSS/JS 原型）
- **docs/** — 设计与规格文档

## 运行方式

### 前端（微信小程序）
用微信开发者工具直接导入 `frontend/` 目录即可。

### 后端
本地构建 jar → 本机 Docker 打包 → 导入 K3s containerd。详见 memory 中的「轻享瘦后端部署」条目。

## 样式基准

**light-fit.html** 是 UI 视觉设计源文件（内联 CSS/JS 的单文件 H5 原型），小程序前端的样式需对齐到这个文件。修改前端样式前，先查阅 light-fit.html 中对应页面/组件的样式；如果两端不一致，改小程序以贴近 light-fit.html，而不是反过来。

## 小程序开发注意事项

- 前端为**原生微信小程序**，使用 WXML + WXSS + JS（Page 模式），不使用任何框架
- 全局状态管理通过 `app.js` 的 `globalData` + `getApp()` 实现
- API 请求封装在 `utils/request.js`，使用 `wx.request`
- 后端 API 地址配置在 `utils/config.js`

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
