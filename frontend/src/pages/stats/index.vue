<template>
  <view class="page">
    <view class="header"><text class="title">统计</text></view>

    <!-- 日期范围选择 -->
    <view class="card date-range-selector">
      <text class="date-range-header">选择时间范围</text>
      <view class="date-range-inputs">
        <view class="date-input-group">
          <text class="label">开始日期</text>
          <picker mode="date" :value="startDate" @change="onStartChange">
            <view class="date-input">{{ startDate }}</view>
          </picker>
        </view>
        <text class="date-separator">至</text>
        <view class="date-input-group">
          <text class="label">结束日期</text>
          <picker mode="date" :value="endDate" @change="onEndChange">
            <view class="date-input">{{ endDate }}</view>
          </picker>
        </view>
      </view>
      <view class="quick-date-btns">
        <view
          v-for="d in [7, 14, 30]"
          :key="d"
          class="quick-date-btn"
          :class="{ active: quickDays === d }"
          @tap="selectQuick(d)"
        >最近{{ d }}天</view>
      </view>
    </view>

    <!-- 图表 -->
    <view class="card chart-container">
      <text class="card-title">热量缺口趋势</text>
      <canvas
        canvas-id="deficit-chart"
        id="deficit-chart"
        class="chart"
      />
    </view>

    <!-- 数据汇总 -->
    <view class="card stats-summary">
      <text class="card-title">数据汇总</text>
      <view class="summary-grid">
        <view class="summary-item">
          <text class="label">平均缺口</text>
          <view class="value-row">
            <text class="value">{{ summary.avgDeficit }}</text>
            <text class="small">大卡/天</text>
          </view>
        </view>
        <view class="summary-item">
          <text class="label">达标天数</text>
          <view class="value-row">
            <text class="value">{{ summary.achieveDays }}</text>
            <text class="small">天</text>
          </view>
        </view>
        <view class="summary-item">
          <text class="label">总缺口</text>
          <view class="value-row">
            <text class="value">{{ summary.totalDeficit }}</text>
            <text class="small">大卡</text>
          </view>
        </view>
        <view class="summary-item">
          <text class="label">预估减重</text>
          <view class="value-row">
            <text class="value">{{ summary.estWeightLoss }}</text>
            <text class="small">kg</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="card record-history">
      <text class="card-title">历史记录</text>
      <view v-if="historyList.length === 0" class="empty">暂无记录</view>
      <view
        v-for="item in historyList"
        :key="item.date"
        class="history-item"
      >
        <view class="history-date">
          <text>{{ item.dateLabel }}</text>
          <text v-if="item.achieved" class="achieved-tag"> 达标</text>
        </view>
        <view class="history-detail">
          <text>摄入 {{ Math.round(item.totalIntake) }} | 运动 {{ Math.round(item.totalExercise) }}</text>
          <text class="history-deficit">缺口 {{ Math.round(item.deficit) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { recordApi } from '../../api/record'
import { useUserStore } from '../../store/index'
import { estimateWeightLoss } from '../../utils/calculator'

const userStore = useUserStore()
const quickDays = ref(7)
const startDate = ref('')
const endDate   = ref('')
const records   = ref([])
const summary   = ref({ avgDeficit: 0, achieveDays: 0, totalDeficit: 0, estWeightLoss: '0.00' })

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

function selectQuick(days) {
  quickDays.value = days
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - days + 1)
  startDate.value = fmtDate(start)
  endDate.value   = fmtDate(today)
  loadStats()
}

function onStartChange(e) {
  startDate.value = e.detail.value
  quickDays.value = 0
  loadStats()
}

function onEndChange(e) {
  endDate.value = e.detail.value
  quickDays.value = 0
  loadStats()
}

async function loadStats() {
  if (!startDate.value || !endDate.value) return
  const start = new Date(startDate.value)
  const end   = new Date(endDate.value)
  const dates = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(fmtDate(d))
  }

  const results = await Promise.allSettled(
    dates.map(date => recordApi.getByDate(date))
  )

  const rs = results.map((r, i) => ({
    date: dates[i],
    totalIntake:   r.status === 'fulfilled' ? (r.value.totalIntake   || 0) : 0,
    totalExercise: r.status === 'fulfilled' ? (r.value.totalExercise || 0) : 0,
    deficit:       r.status === 'fulfilled' ? (r.value.deficit       || 0) : 0
  }))
  records.value = rs

  const target = userStore.targetDeficit
  const total  = rs.reduce((s, r) => s + r.deficit, 0)
  const achieved = rs.filter(r => r.deficit >= target * 0.8).length
  summary.value = {
    avgDeficit:    Math.round(total / rs.length),
    achieveDays:   achieved,
    totalDeficit:  Math.round(total),
    estWeightLoss: estimateWeightLoss(total)
  }
}

const historyList = computed(() => {
  const target = userStore.targetDeficit
  return [...records.value]
    .filter(r => r.totalIntake > 0)
    .reverse()
    .map(r => {
      const d = new Date(r.date)
      return {
        ...r,
        dateLabel: `${d.getMonth() + 1}月${d.getDate()}日`,
        achieved: r.deficit >= target
      }
    })
})

// Canvas 图表渲染（跨平台 H5/小程序）
function drawChart() {
  const rs = records.value
  const ctx = uni.createCanvasContext('deficit-chart')
  const W = 330, H = 200
  const pad = { top: 20, right: 15, bottom: 30, left: 40 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom

  ctx.clearRect(0, 0, W, H)
  if (rs.length === 0) { ctx.draw(); return }

  const target = userStore.targetDeficit || 400
  const deficits = rs.map(r => r.deficit || 0)
  const maxD = Math.max(...deficits, target, 500)
  const range = maxD || 1
  const barW = cw / rs.length
  const gap = Math.max(2, barW * 0.2)
  const bw = Math.max(6, barW - gap)

  // 横向网格线 + Y 轴标签
  ctx.setStrokeStyle('#eee')
  ctx.setLineWidth(1)
  ctx.setFillStyle('#7f8c8d')
  ctx.setFontSize(10)
  ctx.setTextAlign('right')
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch / 4) * i
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(W - pad.right, y)
    ctx.stroke()
    const val = Math.round(maxD - (range / 4) * i)
    ctx.fillText(String(val), pad.left - 5, y + 4)
  }

  // 柱子
  rs.forEach((r, i) => {
    const x = pad.left + barW * i + (barW - bw) / 2
    const d = r.deficit || 0
    const h = Math.max(2, (d / range) * ch)
    const y = pad.top + ch - h
    const color = d >= target ? '#2ecc71' : (d > 0 ? '#f39c12' : '#bdc3c7')
    ctx.setFillStyle(color)
    ctx.fillRect(x, y, bw, h)
  })

  // 目标缺口虚线
  const ty = pad.top + ch - (target / range) * ch
  ctx.setStrokeStyle('#e74c3c')
  ctx.setLineWidth(2)
  ctx.setLineDash && ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(pad.left, ty)
  ctx.lineTo(W - pad.right, ty)
  ctx.stroke()
  ctx.setLineDash && ctx.setLineDash([])

  // 目标文字
  ctx.setFillStyle('#e74c3c')
  ctx.setFontSize(11)
  ctx.setTextAlign('right')
  ctx.fillText('目标', W - pad.right, ty - 5)

  // X 轴日期
  ctx.setFillStyle('#7f8c8d')
  ctx.setFontSize(10)
  ctx.setTextAlign('center')
  rs.forEach((r, i) => {
    const x = pad.left + barW * i + barW / 2
    const d = new Date(r.date)
    ctx.fillText(`${d.getMonth() + 1}/${d.getDate()}`, x, H - 10)
  })

  ctx.draw()
}

watch(records, () => { nextTick(drawChart) }, { deep: true })

onShow(() => {
  if (!startDate.value) selectQuick(7)
  else loadStats()
})
onMounted(() => selectQuick(7))
</script>

<style scoped>
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
  margin: 0 -16px 16px;
}
.title {
  display: block;
  font-size: 16px; color: #2ecc71; font-weight: 600;
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

/* 日期范围 */
.date-range-header {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.date-range-inputs {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}
.date-input-group { flex: 1; }
.date-input-group .label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}
.date-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.date-separator {
  color: #7f8c8d;
  padding-bottom: 10px;
}
.quick-date-btns {
  display: flex;
  gap: 8px;
}
.quick-date-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #7f8c8d;
  font-size: 13px;
  text-align: center;
}
.quick-date-btn.active {
  background: #2ecc71;
  border-color: #2ecc71;
  color: #fff;
}

/* 图表 */
.chart-container { min-height: 240px; }
.chart { width: 100%; height: 200px; }

/* 数据汇总 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.summary-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.summary-item .label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}
.value-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}
.summary-item .value {
  font-size: 24px;
  font-weight: 600;
  color: #2ecc71;
}
.summary-item .small {
  font-size: 11px;
  color: #95a5a6;
}

/* 历史记录 */
.history-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.history-item:last-child { border-bottom: none; }
.history-date {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
.achieved-tag { color: #2ecc71; font-size: 12px; font-weight: normal; }
.history-detail {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #7f8c8d;
}
.history-deficit { font-weight: 600; color: #2ecc71; }
.empty {
  text-align: center;
  color: #7f8c8d;
  padding: 20px 0;
  font-size: 14px;
}
</style>
