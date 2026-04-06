const { userApi } = require('./api/user')

App({
  globalData: {
    token: '',
    profile: null,
    todayRecord: null
  },

  onLaunch() {
    this.globalData.token = wx.getStorageSync('token') || ''
    this.checkAuth()
  },

  checkAuth() {
    if (!this.globalData.token) {
      wx.reLaunch({ url: '/pages/login/index' })
    }
  },

  setToken(t) {
    this.globalData.token = t
    wx.setStorageSync('token', t)
  },

  async loadProfile() {
    try {
      this.globalData.profile = await userApi.getProfile()
    } catch (e) {
      // 首次登录可能还没有档案
    }
  },

  setTodayRecord(record) {
    this.globalData.todayRecord = record
  },

  getProfile() {
    return this.globalData.profile || {}
  },

  getBmr() {
    return (this.globalData.profile && this.globalData.profile.bmr) || 0
  },

  getTargetDeficit() {
    return (this.globalData.profile && this.globalData.profile.targetDeficit) || 400
  },

  logout() {
    this.globalData.token = ''
    this.globalData.profile = null
    this.globalData.todayRecord = null
    wx.removeStorageSync('token')
    wx.reLaunch({ url: '/pages/login/index' })
  }
})
