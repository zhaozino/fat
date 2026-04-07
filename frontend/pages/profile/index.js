var userApi = require('../../api/user').userApi
var feedbackApi = require('../../api/feedback').feedbackApi

var app = getApp()

var activityOptions = [
  { label: '久坐（几乎不运动）',     value: 1.2   },
  { label: '轻度活动（每周1-3天）',  value: 1.375 },
  { label: '中度活动（每周3-5天）',  value: 1.55  },
  { label: '高度活动（每周6-7天）',  value: 1.725 },
  { label: '非常高强度（体力劳动）', value: 1.9   }
]

var activityLabels = activityOptions.map(function (o) { return o.label })

Page({
  data: {
    saving: false,
    bmrValue: 0,
    bmrValueRound: 0,
    gender: 'male',
    height: '',
    weight: '',
    age: '',
    activityLevel: 1.55,
    activityIndex: 2,
    targetDeficit: 400,
    maskedPhone: '未登录',
    activityLabels: activityLabels,
    feedbackText: '',
    feedbackSubmitting: false,
    feedbackOpen: false
  },

  onShow: function () {
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 })
    this.loadProfile()
  },

  loadProfile: function () {
    var that = this
    // 更新手机号显示
    var profile = app.getProfile()
    var phone = (profile && profile.phone) || ''
    that.setData({
      maskedPhone: phone ? phone.slice(0, 3) + '****' + phone.slice(7) : '未登录'
    })

    userApi.getProfile().then(function (data) {
      var idx = 2
      if (data.activityLevel) {
        for (var i = 0; i < activityOptions.length; i++) {
          if (activityOptions[i].value === data.activityLevel) { idx = i; break }
        }
      }
      that.setData({
        gender: data.gender || 'male',
        height: data.height || '',
        weight: data.weight || '',
        age: data.age || '',
        activityLevel: data.activityLevel || 1.55,
        activityIndex: idx,
        targetDeficit: data.targetDeficit || 400,
        bmrValue: data.bmr || 0,
        bmrValueRound: Math.round(data.bmr || 0)
      })
    }).catch(function () {})
  },

  setGender: function (e) {
    this.setData({ gender: e.currentTarget.dataset.gender })
  },

  onHeightInput: function (e) {
    this.setData({ height: e.detail.value })
  },

  onWeightInput: function (e) {
    this.setData({ weight: e.detail.value })
  },

  onAgeInput: function (e) {
    this.setData({ age: e.detail.value })
  },

  onActivityChange: function (e) {
    var idx = e.detail.value
    this.setData({
      activityIndex: idx,
      activityLevel: activityOptions[idx].value
    })
  },

  onTargetInput: function (e) {
    this.setData({ targetDeficit: e.detail.value })
  },

  saveProfile: function () {
    var that = this
    that.setData({ saving: true })

    var data = {
      gender: that.data.gender,
      height: Number(that.data.height),
      weight: Number(that.data.weight),
      age: Number(that.data.age),
      activityLevel: that.data.activityLevel,
      targetDeficit: Number(that.data.targetDeficit)
    }

    userApi.saveProfile(data).then(function (res) {
      that.setData({
        bmrValue: res.bmr || 0,
        bmrValueRound: Math.round(res.bmr || 0)
      })
      app.globalData.profile = res
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(function () {}).then(function () {
      that.setData({ saving: false })
    })
  },

  toggleFeedback: function () {
    this.setData({ feedbackOpen: !this.data.feedbackOpen })
  },

  onFeedbackInput: function (e) {
    this.setData({ feedbackText: e.detail.value })
  },

  submitFeedback: function () {
    var that = this
    var text = that.data.feedbackText.trim()
    if (!text) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }
    that.setData({ feedbackSubmitting: true })
    feedbackApi.submit(text).then(function () {
      that.setData({ feedbackText: '' })
      wx.showToast({ title: '感谢您的反馈！', icon: 'success' })
    }).catch(function () {
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    }).then(function () {
      that.setData({ feedbackSubmitting: false })
    })
  },

  exportData: function () {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  clearData: function () {
    wx.showModal({
      title: '确认清除',
      content: '将清除所有本地数据，此操作不可撤销',
      success: function (res) {
        if (res.confirm) {
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  },

  logout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) app.logout()
      }
    })
  }
})
