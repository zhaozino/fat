import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '../api/user'

export const useUserStore = defineStore('user', () => {
  const token   = ref(uni.getStorageSync('token') || '')
  const profile = ref(null)   // 用户档案（来自后端）
  const todayRecord = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const bmr = computed(() => profile.value?.bmr || 0)
  const targetDeficit = computed(() => profile.value?.targetDeficit || 400)

  function checkAuth() {
    if (!token.value) {
      uni.reLaunch({ url: '/src/pages/login/index' })
    }
  }

  function setToken(t) {
    token.value = t
    uni.setStorageSync('token', t)
  }

  function logout() {
    token.value = ''
    profile.value = null
    todayRecord.value = null
    uni.removeStorageSync('token')
    uni.reLaunch({ url: '/src/pages/login/index' })
  }

  async function loadProfile() {
    try {
      profile.value = await userApi.getProfile()
    } catch (e) {
      // 忽略，首次登录可能还没有档案
    }
  }

  function setTodayRecord(record) {
    todayRecord.value = record
  }

  return {
    token, profile, todayRecord,
    isLoggedIn, bmr, targetDeficit,
    checkAuth, setToken, logout, loadProfile, setTodayRecord
  }
})
