var parseApi = require('../../api/parse').parseApi
var fileApi = require('../../api/file').fileApi
var recordApi = require('../../api/record').recordApi

var plugin = requirePlugin('WechatSI')
var voiceManager = plugin.getRecordRecognitionManager()
var msgId = 0

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    scrollTop: 0,
    recording: false
  },

  onLoad: function () {
    this.initVoice()
  },

  initVoice: function () {
    var that = this

    voiceManager.onStart = function () {
      that.setData({ recording: true })
    }

    voiceManager.onRecognize = function (res) {
      // 实时识别结果（可选：实时显示在输入框）
      if (res.result) {
        that.setData({ inputText: res.result })
      }
    }

    voiceManager.onStop = function (res) {
      that.setData({ recording: false })
      if (res.result) {
        that.setData({ inputText: res.result })
      }
    }

    voiceManager.onError = function (res) {
      that.setData({ recording: false })
      wx.showToast({ title: '语音识别失败', icon: 'none' })
    }
  },

  onVoiceStart: function () {
    voiceManager.start({ lang: 'zh_CN' })
  },

  onVoiceEnd: function () {
    if (this.data.recording) {
      voiceManager.stop()
    }
  },

  onShow: function () {
    var action = wx.getStorageSync('quickAction')
    if (action) {
      wx.removeStorageSync('quickAction')
      var map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', exercise: '运动' }
      this.setData({ inputText: map[action] || '' })
    }
  },

  onInputChange: function (e) {
    this.setData({ inputText: e.detail.value })
  },

  addMsg: function (role, text, imageUrl) {
    var msgs = this.data.messages.slice()
    msgs.push({ id: ++msgId, role: role, text: text, imageUrl: imageUrl || null })
    this.setData({ messages: msgs, scrollTop: 99999 })
  },

  onSend: function () {
    var text = this.data.inputText.trim()
    if (!text) return
    this.setData({ inputText: '' })
    this.addMsg('user', text)
    this.parseAndSave(text, null)
  },

  onCamera: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sourceType: ['camera', 'album'],
      success: function (res) {
        var tempPath = res.tempFilePaths[0]
        that.setData({ loading: true })
        that.addMsg('user', that.data.inputText || '', tempPath)

        fileApi.getUploadToken().then(function (token) {
          return fileApi.uploadToCos(token, tempPath)
        }).then(function (cosUrl) {
          var text = that.data.inputText.trim() || null
          that.setData({ inputText: '' })
          return that.parseAndSave(text, cosUrl)
        }).catch(function () {
          that.setData({ loading: false })
          that.addMsg('ai', '图片上传失败，请重试')
        })
      }
    })
  },

  parseAndSave: function (text, imageUrl) {
    var that = this
    that.setData({ loading: true })
    var mealType = that.getMealType()

    return parseApi.parse(text, imageUrl, mealType).then(function (parsed) {
      return recordApi.save({
        type: parsed.type,
        name: parsed.name,
        calories: parsed.calories,
        displayText: parsed.displayText,
        isEstimated: parsed.isEstimated,
        mealType: mealType,
        imageUrl: imageUrl || null
      }).then(function (saved) {
        var tag = parsed.isEstimated ? '（估算）' : ''
        var label = parsed.type === 'exercise'
          ? '已记录运动「' + parsed.name + '」，消耗约 ' + Math.round(parsed.calories) + ' 大卡' + tag
          : '已记录「' + parsed.name + '」，约 ' + Math.round(parsed.calories) + ' 大卡' + tag
        that.addMsg('ai', label + '\n今日缺口：' + Math.round(saved.deficit) + ' 大卡')
      })
    }).catch(function () {
      that.addMsg('ai', '记录失败，请重试')
    }).then(function () {
      that.setData({ loading: false })
    })
  },

  getMealType: function () {
    var h = new Date().getHours()
    if (h < 10) return 'breakfast'
    if (h < 14) return 'lunch'
    if (h < 20) return 'dinner'
    return 'snack'
  }
})
