<template>
  <view class="page">
    <view class="header"><text class="title">记录</text></view>

    <!-- 消息列表 -->
    <scroll-view class="chat-scroll" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <view class="chat-list">
        <view class="msg ai">
          <view class="avatar">AI</view>
          <view class="bubble ai-bubble">
            <text>你好！告诉我你吃了什么或者做了什么运动，我来帮你记录~</text>
            <text class="hint">支持三种输入方式：</text>
            <text class="hint">文字输入 | 拍照识别 | 语音输入</text>
          </view>
        </view>

        <view v-for="msg in messages" :key="msg.id" class="msg" :class="msg.role">
          <view v-if="msg.role === 'ai'" class="avatar">AI</view>
          <!-- 图片消息 -->
          <view v-if="msg.imageUrl" class="bubble user-bubble img-msg">
            <image :src="msg.imageUrl" mode="widthFix" class="msg-image" />
            <text v-if="msg.text">{{ msg.text }}</text>
          </view>
          <view v-else class="bubble" :class="msg.role + '-bubble'">
            <text>{{ msg.text }}</text>
          </view>
          <view v-if="msg.role === 'user'" class="avatar user-av">我</view>
        </view>

        <view v-if="loading" class="msg ai">
          <view class="avatar">AI</view>
          <view class="bubble ai-bubble">
            <text class="loading-dots">识别中...</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区 -->
    <view class="input-area">
      <view class="camera-btn" @tap="onCamera">
        <image class="icon-img" src="/static/icons/camera.png" mode="aspectFit" />
      </view>
      <view class="input-wrapper">
        <input
          class="chat-input"
          v-model="inputText"
          placeholder="输入食物或运动..."
          placeholder-class="ph"
          confirm-type="send"
          @confirm="onSend"
          :adjust-position="true"
        />
      </view>
      <view class="send-btn" @tap="onSend">
        <image class="icon-img" src="/static/icons/send.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { parseApi } from '../../api/parse'
import { fileApi } from '../../api/file'
import { recordApi } from '../../api/record'

const messages  = ref([])
const inputText = ref('')
const loading   = ref(false)
const scrollTop = ref(0)
let msgId = 0

function addMsg(role, text, imageUrl = null) {
  messages.value.push({ id: ++msgId, role, text, imageUrl })
  nextTick(() => { scrollTop.value = 99999 })
}

// ── P1：文字输入 → AI 解析 → 保存 ─────────────────────────────────────────

async function onSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  addMsg('user', text)
  await parseAndSave(text, null)
}

// ── P2：拍照 → COS 上传 → AI 识别 → 保存 ──────────────────────────────────

async function onCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      loading.value = true
      addMsg('user', inputText.value || '', tempPath)  // 先显示本地预览

      try {
        // 获取 STS 凭证并上传
        const token   = await fileApi.getUploadToken()
        const cosUrl  = await fileApi.uploadToCos(token, tempPath)
        const text    = inputText.value.trim() || null
        inputText.value = ''
        await parseAndSave(text, cosUrl)
      } catch (e) {
        loading.value = false
        addMsg('ai', '图片上传失败，请重试')
      }
    }
  })
}

// ── 公共：调用 parse API → 保存记录 ────────────────────────────────────────

async function parseAndSave(text, imageUrl) {
  loading.value = true
  try {
    const mealType = getMealType()
    // P1/P2: 调用后端 AI 解析
    const parsed = await parseApi.parse(text, imageUrl, mealType)

    // 保存记录
    const saved = await recordApi.save({
      type:        parsed.type,
      name:        parsed.name,
      calories:    parsed.calories,
      displayText: parsed.displayText,
      isEstimated: parsed.isEstimated,
      mealType:    mealType,
      imageUrl:    imageUrl || null
    })

    const tag   = parsed.isEstimated ? '（估算）' : ''
    const label = parsed.type === 'exercise'
      ? `已记录运动「${parsed.name}」，消耗约 ${Math.round(parsed.calories)} 大卡${tag}`
      : `已记录「${parsed.name}」，约 ${Math.round(parsed.calories)} 大卡${tag}`
    addMsg('ai', label + `\n今日缺口：${Math.round(saved.deficit)} 大卡`)
  } catch (e) {
    addMsg('ai', '记录失败，请重试')
  } finally {
    loading.value = false
  }
}

function getMealType() {
  const h = new Date().getHours()
  if (h < 10) return 'breakfast'
  if (h < 14) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

onShow(() => {
  const action = uni.getStorageSync('quickAction')
  if (action) {
    uni.removeStorageSync('quickAction')
    const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', exercise: '运动' }
    inputText.value = map[action] || ''
  }
})
</script>

<style scoped>
.page {
  display: flex; flex-direction: column;
  min-height: 100vh; background: #f5f7f5;
  padding-bottom: 120px;  /* 为 input-area(60) + tabbar(60) 留空间 */
}

/* 头部 - sticky 固定在顶部 */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #f5f7f5;
  text-align: center;
  padding: 6px 0;
}
.title {
  display: block;
  font-size: 16px; color: #2ecc71; font-weight: 600;
}

.chat-scroll { flex: 1; overflow: hidden; }
.chat-list {
  padding: 16px 16px 24px;
  display: flex; flex-direction: column; gap: 12px;
}

.msg { display: flex; align-items: flex-start; gap: 10px; max-width: 85%; }
.msg.user { flex-direction: row-reverse; align-self: flex-end; }

.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff; font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.user-av { background: #3498db; }

.bubble {
  padding: 10px 14px;
  border-radius: 12px; font-size: 14px;
  line-height: 1.5; word-break: break-all;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.ai-bubble   { background: #e8f5e9; color: #2c3e50; }
.user-bubble { background: #3498db; color: #fff; }

.img-msg { display: flex; flex-direction: column; gap: 6px; }
.msg-image { width: 160px; border-radius: 8px; }

.hint { display: block; font-size: 12px; color: #7f8c8d; margin-top: 6px; }
.loading-dots { color: #95a5a6; }

/* 输入区 - 固定在 tabbar 上方 */
.input-area {
  position: fixed;
  bottom: 60px;  /* tabbar 高度 */
  left: 0; right: 0;
  width: 100%; max-width: 414px;
  margin: 0 auto;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: #f7f7f7;
  border-top: 1px solid #e5e5e5;
  box-sizing: border-box;
  z-index: 50;
}

.camera-btn {
  width: 36px; height: 36px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #2ecc71;
}
.icon-img { width: 22px; height: 22px; }
.send-btn .icon-img { width: 20px; height: 20px; }

.input-wrapper {
  flex: 1; min-width: 0;
  display: flex; align-items: center;
  background: #fff; border-radius: 20px;
  padding: 4px 8px;
  min-height: 36px;
}
.chat-input {
  flex: 1; width: 100%;
  padding: 6px 8px;
  border: none; background: transparent;
  font-size: 14px; outline: none;
  line-height: 1.4;
}

.send-btn {
  width: 36px; height: 36px; flex-shrink: 0;
  background: #2ecc71; color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.ph { color: #b2b2b2; }
</style>
