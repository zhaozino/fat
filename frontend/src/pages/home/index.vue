<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header">
      <text class="title">轻享瘦</text>
      <text class="sub">科学管理热量，轻松达成目标</text>
    </view>

    <!-- 今日概览卡片 -->
    <view class="card today-card">
      <text class="card-title">今日概览</text>
      <!-- 圆环（canvas 跨平台） -->
      <view class="deficit-display">
        <view class="deficit-circle">
          <canvas
            canvas-id="deficit-canvas"
            id="deficit-canvas"
            class="circle-canvas"
          />
          <view class="deficit-value">
            <text class="deficit-num">{{ Math.round(deficit) }}</text>
            <text class="deficit-sub">
              <text class="burn-val">{{ targetDeficit }}</text> 大卡
            </text>
          </view>
        </view>
      </view>
      <text class="circle-label">热量缺口</text>
      <view class="circle-legend">
        <view class="legend-item">
          <view class="legend-dot intake"></view>
          <text>摄入</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot exercise"></view>
          <text>消耗</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot excess"></view>
          <text>摄入超标</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot target"></view>
          <text>目标缺口</text>
        </view>
      </view>
      <!-- 三列统计 -->
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-label">摄入</text>
          <text class="stat-val">{{ Math.round(totalIntake) }}</text>
          <text class="stat-unit">大卡</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">消耗</text>
          <text class="stat-val">{{ Math.round(totalExercise) }}</text>
          <text class="stat-unit">大卡</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">基础代谢</text>
          <text class="stat-val">{{ Math.round(bmr) }}</text>
          <text class="stat-unit">大卡</text>
        </view>
      </view>
    </view>

    <!-- AI 鼓励消息 -->
    <view class="card ai-card">
      <view class="ai-avatar">AI</view>
      <view class="ai-bubble">
        <text>{{ aiMsg }}</text>
      </view>
    </view>

    <!-- 快速记录 -->
    <view class="card">
      <text class="card-title">快速记录</text>
      <view class="quick-grid">
        <button
          v-for="btn in quickBtns"
          :key="btn.action"
          class="quick-btn"
          @tap="goRecord(btn.action)"
        >{{ btn.label }}</button>
      </view>
    </view>

    <!-- 今日记录 -->
    <view class="card today-records">
      <text class="card-title">今日记录</text>
      <view v-if="todayRecords.length === 0" class="empty-records">
        <text>暂无记录，快去添加吧~</text>
      </view>
      <view v-else>
        <view
          v-for="(item, i) in todayRecords"
          :key="i"
          class="record-item"
        >
          <view :class="['record-icon', item.type]">
            <text>{{ item.type === 'intake' ? '🍜' : '🏃' }}</text>
          </view>
          <view class="record-info">
            <text class="record-name">{{ item.name }}</text>
            <text class="record-time">{{ item.time || '刚刚' }}</text>
          </view>
          <text :class="['record-calories', item.type]">
            {{ item.type === 'intake' ? '+' : '-' }}{{ item.calories }} 大卡
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/index'
import { recordApi } from '../../api/record'
import { encourageApi } from '../../api/encourage'

const userStore = useUserStore()

const totalIntake   = ref(0)
const totalExercise = ref(0)
const bmr           = ref(0)
const deficit       = ref(0)
const aiMsg         = ref('开始记录你的一天吧！每一小步都是进步。')
const intakeList    = ref([])
const exerciseList  = ref([])

const todayRecords = computed(() => {
  const list = []
  intakeList.value.forEach(it => list.push({
    type: 'intake',
    name: it.displayText || it.food,
    calories: it.calories,
    time: it.time || ''
  }))
  exerciseList.value.forEach(it => list.push({
    type: 'exercise',
    name: it.displayText || it.activity,
    calories: it.calories,
    time: it.time || ''
  }))
  list.sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return b.time.localeCompare(a.time)
  })
  return list
})
const targetDeficit = computed(() => userStore.targetDeficit || 400)

// Canvas 圆环渲染（跨平台 H5/小程序）
function drawCircle() {
  const ctx = uni.createCanvasContext('deficit-canvas')
  const cx = 80, cy = 80, r = 64  // canvas 160x160，半径留边
  const lineW = 12
  const intake = totalIntake.value || 0
  const exercise = totalExercise.value || 0
  const tdee = bmr.value || 0
  const totalBurn = tdee + exercise
  const target = targetDeficit.value || 400

  // 底环（灰）
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.setStrokeStyle('#eee')
  ctx.setLineWidth(lineW)
  ctx.stroke()

  if (totalBurn > 0) {
    const intakeRatio = Math.min(intake / totalBurn, 1)
    const startAngle = -Math.PI / 2  // 从顶部开始

    // 消耗弧（绿）— 紧跟摄入弧之后
    if (intake < totalBurn) {
      const exerciseRatio = 1 - intakeRatio
      ctx.beginPath()
      ctx.arc(
        cx, cy, r,
        startAngle + intakeRatio * 2 * Math.PI,
        startAngle + (intakeRatio + exerciseRatio) * 2 * Math.PI
      )
      ctx.setStrokeStyle('#2ecc71')
      ctx.setLineWidth(lineW)
      ctx.setLineCap('round')
      ctx.stroke()
    }

    // 摄入弧（红）
    ctx.beginPath()
    ctx.arc(
      cx, cy, r,
      startAngle,
      startAngle + intakeRatio * 2 * Math.PI
    )
    ctx.setStrokeStyle('#e74c3c')
    ctx.setLineWidth(lineW)
    ctx.setLineCap('round')
    ctx.stroke()

    // 超标弧（深红）— 从顶部重新开始
    const excess = Math.max(intake - totalBurn, 0)
    if (excess > 0) {
      const excessRatio = Math.min(excess / totalBurn, 1)
      ctx.beginPath()
      ctx.arc(
        cx, cy, r,
        startAngle,
        startAngle + excessRatio * 2 * Math.PI
      )
      ctx.setStrokeStyle('#8e1a1a')
      ctx.setLineWidth(lineW)
      ctx.setLineCap('round')
      ctx.stroke()
    }

    // 目标缺口标记（蓝色小矩形）
    const targetIntake = totalBurn - target
    if (targetIntake > 0 && targetIntake < totalBurn) {
      const angle = startAngle + (targetIntake / totalBurn) * 2 * Math.PI
      const mx = cx + Math.cos(angle) * r
      const my = cy + Math.sin(angle) * r
      ctx.save()
      ctx.translate(mx, my)
      ctx.rotate(angle + Math.PI / 2)
      ctx.setFillStyle('#3498db')
      ctx.fillRect(-3, -7, 6, 14)
      ctx.restore()
    }
  }

  ctx.draw()
}

watch([totalIntake, totalExercise, bmr, targetDeficit], () => {
  nextTick(drawCircle)
})

const quickBtns = [
  { label: '早餐', action: 'breakfast' },
  { label: '午餐', action: 'lunch' },
  { label: '晚餐', action: 'dinner' },
  { label: '运动', action: 'exercise' }
]

async function loadToday() {
  try {
    const data = await recordApi.getByDate()
    totalIntake.value   = data.totalIntake   || 0
    totalExercise.value = data.totalExercise || 0
    deficit.value       = data.deficit       || 0
    bmr.value           = data.bmr           || userStore.bmr
    intakeList.value    = data.intake        || []
    exerciseList.value  = data.exercise      || []
    userStore.setTodayRecord(data)
  } catch (e) {
    bmr.value = userStore.bmr
  }
  // P3：异步拉取 AI 鼓励消息，失败不影响主界面
  encourageApi.getToday()
    .then(res => { aiMsg.value = res.message })
    .catch(() => {})
}

function goRecord(action) {
  uni.switchTab({ url: '/src/pages/record/index' })
  // 通过本地存储传递 mealType
  uni.setStorageSync('quickAction', action)
}

onShow(loadToday)
onMounted(() => {
  loadToday()
  nextTick(drawCircle)
})
</script>

<style scoped>
/* 所有尺寸与 light-fit.html 对齐 */
.page {
  padding: 16px;
  padding-bottom: 80px;
  background: #f5f7f5;
  min-height: 100vh;
}

/* 头部 - sticky 固定在顶部 */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #f5f7f5;
  text-align: center;
  padding: 6px 0;
  margin: 0 -16px 0;
}
.title {
  display: block;
  font-size: 16px;
  color: #2ecc71;
  font-weight: 600;
}
.sub {
  display: block;
  color: #7f8c8d;
  font-size: 14px;
  margin-top: 4px;
}

/* 卡片 */
.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

/* 今日概览卡片 */
.today-card { text-align: center; }

.deficit-display {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.deficit-circle {
  position: relative;
  width: 160px;
  height: 160px;
}

.circle-canvas {
  width: 160px;
  height: 160px;
}

.deficit-value {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.deficit-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #2ecc71;
}
.deficit-sub {
  display: block;
  font-size: 13px;
  color: #95a5a6;
  margin-top: 2px;
}
.burn-val {
  font-weight: 600;
  color: #7f8c8d;
}

.circle-label {
  display: block;
  text-align: center;
  font-size: 13px;
  color: #7f8c8d;
  margin-top: -8px;
  margin-bottom: 8px;
}

.circle-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
  margin-bottom: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #7f8c8d;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.legend-dot.intake { background: #e74c3c; }
.legend-dot.exercise { background: #2ecc71; }
.legend-dot.excess { background: #8e1a1a; }
.legend-dot.target {
  background: #3498db;
  border-radius: 2px;
  width: 4px;
  height: 10px;
}

/* 三列统计 */
.stats-row {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 12px;
}

.stat-item { text-align: center; }
.stat-label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}
.stat-val {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}
.stat-unit {
  display: block;
  font-size: 11px;
  color: #95a5a6;
}

/* AI 鼓励 */
.ai-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.ai-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.ai-bubble {
  flex: 1;
  background: #e8f5e9;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.5;
}

/* 快速记录 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.quick-btn {
  padding: 12px 8px;
  border: none;
  border-radius: 12px;
  background: #e8f5e9 !important;
  color: #2ecc71;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0;
  min-height: auto;
}
/* 覆盖 uni-app button 默认伪元素边框 */
.quick-btn::after {
  border: none !important;
  border-radius: 12px;
}
.quick-btn:active {
  background: #2ecc71 !important;
  color: #fff;
}

/* 今日记录 */
.today-records { margin-bottom: 80px; }

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.record-item:last-child { border-bottom: none; }

.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
  flex-shrink: 0;
}
.record-icon.intake { background: #fde8e8; color: #e74c3c; }
.record-icon.exercise { background: #e8f5e9; color: #2ecc71; }

.record-info { flex: 1; }
.record-name {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}
.record-time {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
}

.record-calories {
  font-size: 14px;
  font-weight: 600;
}
.record-calories.intake { color: #e74c3c; }
.record-calories.exercise { color: #2ecc71; }

.empty-records {
  text-align: center;
  padding: 30px 0;
  color: #bdc3c7;
  font-size: 14px;
}
</style>
