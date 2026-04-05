<template>
  <view class="page">
    <view class="header"><text class="title">我的</text></view>

    <!-- 用户信息展示 -->
    <view class="card user-card">
      <view class="user-avatar">👤</view>
      <view class="user-info">
        <text class="user-phone">{{ maskedPhone }}</text>
        <text class="user-sub">手机号登录</text>
      </view>
    </view>

    <!-- 个人信息表单 -->
    <view class="card">
      <text class="card-title">个人信息</text>

      <!-- 性别 -->
      <view class="form-group">
        <text class="label">性别</text>
        <view class="gender-row">
          <view
            class="gender-btn"
            :class="{ active: form.gender === 'male' }"
            @tap="form.gender = 'male'"
          >男</view>
          <view
            class="gender-btn"
            :class="{ active: form.gender === 'female' }"
            @tap="form.gender = 'female'"
          >女</view>
        </view>
      </view>

      <!-- 身高体重 -->
      <view class="form-row">
        <view class="form-group half">
          <text class="label">身高 (cm)</text>
          <input class="input" type="number" v-model="form.height" placeholder="170" />
        </view>
        <view class="form-group half">
          <text class="label">体重 (kg)</text>
          <input class="input" type="number" v-model="form.weight" placeholder="70" />
        </view>
      </view>

      <!-- 年龄 -->
      <view class="form-group">
        <text class="label">年龄</text>
        <input class="input" type="number" v-model="form.age" placeholder="25" />
      </view>

      <!-- 活动水平 -->
      <view class="form-group">
        <text class="label">活动水平</text>
        <picker
          mode="selector"
          :range="activityOptions"
          range-key="label"
          :value="activityIndex"
          @change="onActivityChange"
        >
          <view class="picker-row">
            <text>{{ activityOptions[activityIndex].label }}</text>
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 目标缺口 -->
      <view class="form-group">
        <text class="label">目标缺口 (大卡/天)</text>
        <input class="input" type="number" v-model="form.targetDeficit" placeholder="400" />
        <text class="hint">建议 300~500 大卡</text>
      </view>

      <button class="save-btn" :disabled="saving" @tap="saveProfile">
        {{ saving ? '保存中…' : '保存信息' }}
      </button>
    </view>

    <!-- BMR 结果 -->
    <view class="card bmr-card" v-if="bmrValue">
      <text class="bmr-label">基础代谢 (BMR)</text>
      <text class="bmr-val">{{ Math.round(bmrValue) }}</text>
      <text class="bmr-unit">大卡</text>
    </view>

    <!-- 数据操作 -->
    <view class="card actions-card">
      <button class="action-btn" @tap="exportData">导出数据</button>
      <button class="action-btn danger" @tap="clearData">清除数据</button>
    </view>

    <!-- 退出登录 -->
    <view class="card">
      <button class="action-btn danger full" @tap="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/index'
import { userApi } from '../../api/user'

const userStore = useUserStore()

const saving   = ref(false)
const bmrValue = ref(0)

const form = ref({
  gender:        'male',
  height:        '',
  weight:        '',
  age:           '',
  activityLevel: 1.55,
  targetDeficit: 400
})

const activityOptions = [
  { label: '久坐（几乎不运动）',     value: 1.2   },
  { label: '轻度活动（每周1-3天）',  value: 1.375 },
  { label: '中度活动（每周3-5天）',  value: 1.55  },
  { label: '高度活动（每周6-7天）',  value: 1.725 },
  { label: '非常高强度（体力劳动）', value: 1.9   }
]

const activityIndex = computed(() =>
  activityOptions.findIndex(o => o.value === form.value.activityLevel) || 2
)

function onActivityChange(e) {
  form.value.activityLevel = activityOptions[e.detail.value].value
}

const maskedPhone = computed(() => {
  const p = userStore.profile?.phone || ''
  return p ? p.slice(0, 3) + '****' + p.slice(7) : '未登录'
})

async function loadProfile() {
  try {
    const data = await userApi.getProfile()
    if (data.gender)        form.value.gender        = data.gender
    if (data.height)        form.value.height        = data.height
    if (data.weight)        form.value.weight        = data.weight
    if (data.age)           form.value.age           = data.age
    if (data.activityLevel) form.value.activityLevel = data.activityLevel
    if (data.targetDeficit) form.value.targetDeficit = data.targetDeficit
    bmrValue.value = data.bmr || 0
  } catch (e) {}
}

async function saveProfile() {
  saving.value = true
  try {
    const data = await userApi.saveProfile({
      ...form.value,
      height:        Number(form.value.height),
      weight:        Number(form.value.weight),
      age:           Number(form.value.age),
      targetDeficit: Number(form.value.targetDeficit)
    })
    bmrValue.value = data.bmr || 0
    userStore.profile = data
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    // request.js 已 toast
  } finally {
    saving.value = false
  }
}

function exportData() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function clearData() {
  uni.showModal({
    title: '确认清除',
    content: '将清除所有本地数据，此操作不可撤销',
    success(res) {
      if (res.confirm) {
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    }
  })
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success(res) {
      if (res.confirm) userStore.logout()
    }
  })
}

onShow(loadProfile)
onMounted(loadProfile)
</script>

<style scoped>
.page { padding: 0 16px 80px; background: #f5f7f5; min-height: 100vh; }

/* 头部 - sticky 固定在顶部（对齐 light-fit.html） */
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

.card {
  background: #fff; border-radius: 24rpx;
  padding: 28rpx; margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

.card-title {
  display: block; font-size: 28rpx; font-weight: 600; color: #333;
  margin-bottom: 20rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid #f0f0f0;
}

.user-card { display: flex; align-items: center; gap: 24rpx; }
.user-avatar { font-size: 64rpx; }
.user-phone { display: block; font-size: 32rpx; font-weight: 600; color: #333; }
.user-sub   { display: block; font-size: 22rpx; color: #95a5a6; margin-top: 4rpx; }

.form-group  { margin-bottom: 28rpx; }
.form-row    { display: flex; gap: 20rpx; }
.half        { flex: 1; }
.label       { display: block; font-size: 26rpx; color: #333; margin-bottom: 12rpx; }

.input {
  width: 100%; height: 88rpx;
  border: 1rpx solid #e0e0e0; border-radius: 12rpx;
  padding: 0 24rpx; font-size: 28rpx; background: #fafafa;
}

.gender-row  { display: flex; gap: 16rpx; }
.gender-btn  {
  flex: 1; height: 80rpx; line-height: 80rpx; text-align: center;
  border: 1rpx solid #e0e0e0; border-radius: 12rpx;
  font-size: 28rpx; background: #fff; color: #666;
}
.gender-btn.active { border-color: #2ecc71; background: #e8f5e9; color: #2ecc71; }

.picker-row {
  display: flex; justify-content: space-between; align-items: center;
  height: 88rpx; border: 1rpx solid #e0e0e0; border-radius: 12rpx;
  padding: 0 24rpx; font-size: 28rpx; background: #fafafa;
}
.arrow { color: #ccc; font-size: 36rpx; }
.hint  { display: block; font-size: 22rpx; color: #95a5a6; margin-top: 8rpx; }

.save-btn {
  width: 100%; height: 96rpx;
  background: #2ecc71; color: #fff;
  border-radius: 16rpx; font-size: 32rpx; font-weight: 600; border: none;
}
.save-btn[disabled] { opacity: 0.5; }

.bmr-card { text-align: center; padding: 32rpx; }
.bmr-label { display: block; font-size: 24rpx; color: #95a5a6; margin-bottom: 8rpx; }
.bmr-val   { display: block; font-size: 64rpx; font-weight: 700; color: #2ecc71; }
.bmr-unit  { display: block; font-size: 22rpx; color: #bdc3c7; }

.actions-card { display: flex; gap: 16rpx; }
.action-btn {
  flex: 1; height: 88rpx;
  border: 1rpx solid #e0e0e0; border-radius: 12rpx;
  background: #fff; font-size: 28rpx; color: #555;
}
.action-btn.danger { border-color: #e74c3c; color: #e74c3c; }
.action-btn.full   { width: 100%; }
</style>
