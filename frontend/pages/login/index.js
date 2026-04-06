var authApi = require('../../api/auth').authApi

var app = getApp()
var timer = null

Page({
  data: {
    phone: '',
    code: '',
    codeSent: false,
    submitting: false,
    countdown: 0,
    tip: '',
    tipType: ''
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value.replace(/\D/g, '').slice(0, 11) })
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
    if (!/^1[3-9]\d{9}$/.test(that.data.phone)) {
      return that.showTip('请输入正确的11位手机号')
    }
    that.setData({ submitting: true })
    authApi.sendSms(that.data.phone).then(function () {
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
