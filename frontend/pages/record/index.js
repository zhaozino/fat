var parseApi = require('../../api/parse').parseApi
var fileApi = require('../../api/file').fileApi
var recordApi = require('../../api/record').recordApi
var app = getApp()

var msgId = 0

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    scrollToId: ''
  },

  onShow: function () {
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 })
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
    var id = ++msgId
    msgs.push({ id: id, role: role, text: text, imageUrl: imageUrl || null })
    this.setData({ messages: msgs, scrollToId: '' }, function () {
      this.setData({ scrollToId: 'chat-bottom' })
    })
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

        var ext = tempPath.split('.').pop() || 'jpg'
        fileApi.getUploadUrl(ext).then(function (resp) {
          return fileApi.uploadWithPresignedUrl(resp, tempPath)
        }).then(function (fileUrl) {
          var text = that.data.inputText.trim() || null
          that.setData({ inputText: '' })
          return that.parseAndSave(text, fileUrl)
        }).catch(function (err) {
          that.setData({ loading: false })
          that.addMsg('ai', '图片上传失败，请重试')
        })
      }
    })
  },

  parseAndSave: function (text, imageUrl) {
    var that = this
    that.setData({ loading: true, scrollToId: '' }, function () {
      that.setData({ scrollToId: 'chat-bottom' })
    })
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
