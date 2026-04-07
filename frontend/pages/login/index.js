var authApi = require('../../api/auth').authApi

var app = getApp()
var timer = null

var AREA_CODES = [
  { code: '+86',  label: '+86 中国大陆', maxLen: 11, regex: /^1[3-9]\d{9}$/, hint: '请输入正确的11位大陆手机号' },
  { code: '+852', label: '+852 中国香港', maxLen: 8,  regex: /^[2-9]\d{7}$/, hint: '请输入正确的8位香港手机号' },
  { code: '+853', label: '+853 中国澳门', maxLen: 8,  regex: /^6\d{7}$/, hint: '请输入正确的8位澳门手机号' }
]

Page({
  data: {
    phone: '',
    code: '',
    codeSent: false,
    submitting: false,
    countdown: 0,
    tip: '',
    tipType: '',
    phoneTip: '',
    areaCodes: AREA_CODES,
    areaIndex: 0
  },

  onAreaChange: function (e) {
    this.setData({ areaIndex: parseInt(e.detail.value), phone: '', phoneTip: '' })
  },

  onPhoneInput: function (e) {
    var maxLen = AREA_CODES[this.data.areaIndex].maxLen
    this.setData({ phone: e.detail.value.replace(/\D/g, '').slice(0, maxLen), phoneTip: '' })
  },

  validatePhone: function () {
    var area = AREA_CODES[this.data.areaIndex]
    if (!area.regex.test(this.data.phone)) {
      this.setData({ phoneTip: area.hint })
      return false
    }
    return true
  },

  onCodeInput: function (e) {
    this.setData({ code: e.detail.value })
  },

  showTip: function (msg, type) {
    this.setData({ tip: msg, tipType: type || 'error' })
  },

  startCountdown: function (sec) {
    var that = this
    that.setData({ countdown: sec || 60 })
    timer = setInterval(function () {
      var c = that.data.countdown - 1
      that.setData({ countdown: c })
      if (c <= 0) clearInterval(timer)
    }, 1000)
  },

  sendCode: function () {
    var that = this
    if (!that.validatePhone()) return
    that.setData({ submitting: true })
    authApi.sendSms(that.data.phone).then(function (res) {
      if (res && res.code) {
        console.log('[测试] 验证码:', res.code)
      }
      that.setData({ codeSent: true })
      that.startCountdown()
      var masked = that.data.phone.slice(0, 3) + '****' + that.data.phone.slice(7)
      that.showTip('验证码已发送至 ' + masked, 'info')
    }).catch(function () {}).then(function () {
      that.setData({ submitting: false })
    })
  },

  onSubmit: function () {
    var that = this
    if (!that.data.codeSent) {
      return that.sendCode()
    }
    if (that.data.code.length !== 6) {
      return that.showTip('请输入6位验证码')
    }
    that.setData({ submitting: true })
    authApi.verify(that.data.phone, that.data.code).then(function (res) {
      app.setToken(res.token)
      return app.loadProfile().then(function () {
        if (res.isNewUser) {
          wx.reLaunch({ url: '/pages/profile/index?newUser=1' })
        } else {
          wx.reLaunch({ url: '/pages/home/index' })
        }
      })
    }).catch(function (e) {
      that.showTip((e && e.message) || '验证失败，请重试')
      that.setData({ submitting: false })
    })
  },

  onUnload: function () {
    if (timer) clearInterval(timer)
  }
})
