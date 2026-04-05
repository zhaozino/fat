<template>
  <view class="login-page">
    <view class="logo-area">
      <view class="logo-icon">瘦</view>
      <text class="logo-title">轻享瘦</text>
      <text class="logo-sub">科学管理热量，轻松达成目标</text>
    </view>

    <view class="form-card">
      <!-- 手机号输入 -->
      <view class="form-group">
        <text class="label">手机号</text>
        <view class="phone-row">
          <text class="prefix">+86</text>
          <input
            class="phone-input"
            type="number"
            v-model="phone"
            maxlength="11"
            placeholder="请输入手机号"
            placeholder-class="ph"
            @input="onPhoneInput"
          />
        </view>
      </view>

      <!-- 验证码输入（发送后显示） -->
      <view class="form-group" v-if="codeSent">
        <text class="label">验证码</text>
        <view class="code-row">
          <input
            class="code-input"
            type="number"
            v-model="code"
            maxlength="6"
            placeholder="请输入6位验证码"
            placeholder-class="ph"
          />
          <button
            class="resend-btn"
            :disabled="countdown > 0"
            @tap="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s后重发` : '重新获取' }}
          </button>
        </view>
        <text v-if="tip" class="tip" :class="tipType">{{ tip }}</text>
      </view>

      <!-- 主按钮 -->
      <button
        class="submit-btn"
        :disabled="submitting"
        @tap="onSubmit"
      >
        {{ submitting ? '处理中…' : (codeSent ? '登录 / 注册' : '获取验证码') }}
      </button>

      <text class="agreement">登录即代表同意
        <text class="link">《用户协议》</text>和
        <text class="link">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { authApi } from '../../api/auth'
import { useUserStore } from '../../store/index'

const userStore = useUserStore()

const phone     = ref('')
const code      = ref('')
const codeSent  = ref(false)
const submitting = ref(false)
const countdown = ref(0)
const tip       = ref('')
const tipType   = ref('')

let timer = null

function onPhoneInput(e) {
  phone.value = e.detail.value.replace(/\D/g, '').slice(0, 11)
}

function showTip(msg, type = 'error') {
  tip.value = msg
  tipType.value = type
}

function startCountdown(sec = 60) {
  countdown.value = sec
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

async function sendCode() {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    return showTip('请输入正确的11位手机号')
  }
  try {
    submitting.value = true
    await authApi.sendSms(phone.value)
    codeSent.value = true
    startCountdown()
    const masked = phone.value.slice(0, 3) + '****' + phone.value.slice(7)
    showTip(`验证码已发送至 ${masked}`, 'info')
  } finally {
    submitting.value = false
  }
}

async function onSubmit() {
  if (!codeSent.value) {
    return sendCode()
  }
  if (code.value.length !== 6) {
    return showTip('请输入6位验证码')
  }
  try {
    submitting.value = true
    const res = await authApi.verify(phone.value, code.value)
    userStore.setToken(res.token)
    await userStore.loadProfile()
    if (res.isNewUser) {
      // 新用户跳转完善信息页
      uni.reLaunch({ url: '/src/pages/profile/index?newUser=1' })
    } else {
      uni.reLaunch({ url: '/src/pages/home/index' })
    }
  } catch (e) {
    showTip(e.message || '验证失败，请重试')
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f7f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 48rpx;
}

.logo-area {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-icon {
  width: 128rpx;
  height: 128rpx;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
  margin: 0 auto 24rpx;
}

.logo-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #2ecc71;
  margin-bottom: 12rpx;
}

.logo-sub {
  font-size: 26rpx;
  color: #95a5a6;
}

.form-card {
  width: 100%;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
}

.form-group {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 26rpx;
  color: #7f8c8d;
  margin-bottom: 16rpx;
}

.phone-row {
  display: flex;
  align-items: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 16rpx;
  overflow: hidden;
}

.prefix {
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  border-right: 1rpx solid #eee;
  height: 88rpx;
  line-height: 88rpx;
  flex-shrink: 0;
}

.phone-input {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  background: transparent;
}

.code-row {
  display: flex;
  gap: 16rpx;
}

.code-input {
  flex: 1;
  height: 88rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  letter-spacing: 8rpx;
}

.resend-btn {
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 28rpx;
  background: #e8f5e9;
  color: #2ecc71;
  border-radius: 16rpx;
  font-size: 24rpx;
  line-height: 88rpx;
  border: none;
}

.resend-btn[disabled] {
  background: #f0f0f0;
  color: #aaa;
}

.tip {
  display: block;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.tip.error { color: #e74c3c; }
.tip.info  { color: #95a5a6; }

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: #2ecc71;
  color: #fff;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  margin-top: 8rpx;
}

.submit-btn[disabled] {
  opacity: 0.5;
}

.agreement {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #95a5a6;
  margin-top: 32rpx;
}

.link { color: #2ecc71; }
.ph { color: #c0c0c0; }
</style>
