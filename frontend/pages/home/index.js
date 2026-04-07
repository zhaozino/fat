var recordApi = require('../../api/record').recordApi
var encourageApi = require('../../api/encourage').encourageApi

var app = getApp()

Page({
  data: {
    totalIntake: 0,
    totalExercise: 0,
    bmr: 0,
    deficit: 0,
    deficitRound: 0,
    totalIntakeRound: 0,
    totalExerciseRound: 0,
    bmrRound: 0,
    targetDeficit: 400,
    aiMsg: '开始记录你的一天吧！每一小步都是进步。',
    intakeList: [],
    exerciseList: [],
    todayRecords: [],
    quickBtns: [
      { label: '早餐', action: 'breakfast' },
      { label: '午餐', action: 'lunch' },
      { label: '晚餐', action: 'dinner' },
      { label: '运动', action: 'exercise' }
    ]
  },

  onShow: function () {
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 })
    this.loadToday()
  },

  onReady: function () {
    this.drawCircle()
  },

  loadToday: function () {
    var that = this
    recordApi.getByDate().then(function (data) {
      var intakeList = data.intake || []
      var exerciseList = data.exercise || []
      var bmrVal = data.bmr || app.getBmr()
      that.setData({
        totalIntake: data.totalIntake || 0,
        totalExercise: data.totalExercise || 0,
        deficit: data.deficit || 0,
        bmr: bmrVal,
        deficitRound: Math.round(data.deficit || 0),
        totalIntakeRound: Math.round(data.totalIntake || 0),
        totalExerciseRound: Math.round(data.totalExercise || 0),
        bmrRound: Math.round(bmrVal),
        targetDeficit: app.getTargetDeficit(),
        intakeList: intakeList,
        exerciseList: exerciseList,
        todayRecords: that.buildTodayRecords(intakeList, exerciseList)
      })
      app.setTodayRecord(data)
      that.drawCircle()
    }).catch(function () {
      that.setData({
        bmr: app.getBmr(),
        bmrRound: Math.round(app.getBmr()),
        targetDeficit: app.getTargetDeficit()
      })
    })

    // 异步拉取 AI 鼓励消息
    encourageApi.getToday().then(function (res) {
      that.setData({ aiMsg: res.message })
    }).catch(function () {})
  },

  buildTodayRecords: function (intakeList, exerciseList) {
    var list = []
    intakeList.forEach(function (it) {
      list.push({
        type: 'intake',
        name: it.displayText || it.food,
        calories: it.calories,
        time: it.time || ''
      })
    })
    exerciseList.forEach(function (it) {
      list.push({
        type: 'exercise',
        name: it.displayText || it.activity,
        calories: it.calories,
        time: it.time || ''
      })
    })
    list.sort(function (a, b) {
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1
      return b.time.localeCompare(a.time)
    })
    return list
  },

  drawCircle: function () {
    var ctx = wx.createCanvasContext('deficit-canvas', this)
    var cx = 80, cy = 80, r = 64
    var lineW = 12
    var intake = this.data.totalIntake || 0
    var exercise = this.data.totalExercise || 0
    var tdee = this.data.bmr || 0
    var totalBurn = tdee + exercise
    var target = this.data.targetDeficit || 400

    // 底环（灰）
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.setStrokeStyle('#eee')
    ctx.setLineWidth(lineW)
    ctx.stroke()

    if (totalBurn > 0) {
      var intakeRatio = Math.min(intake / totalBurn, 1)
      var startAngle = -Math.PI / 2

      // 消耗弧（绿）
      if (intake < totalBurn) {
        var exerciseRatio = 1 - intakeRatio
        ctx.beginPath()
        ctx.arc(
          cx, cy, r,
          startAngle + intakeRatio * 2 * Math.PI,
          startAngle + (intakeRatio + exerciseRatio) * 2 * Math.PI
        )
        ctx.setStrokeStyle('#2ecc71')
        ctx.setLineWidth(lineW)
        ctx.setLineCap('round')
        ctx.stroke()
      }

      // 摄入弧（红）
      ctx.beginPath()
      ctx.arc(
        cx, cy, r,
        startAngle,
        startAngle + intakeRatio * 2 * Math.PI
      )
      ctx.setStrokeStyle('#e74c3c')
      ctx.setLineWidth(lineW)
      ctx.setLineCap('round')
      ctx.stroke()

      // 超标弧（深红）
      var excess = Math.max(intake - totalBurn, 0)
      if (excess > 0) {
        var excessRatio = Math.min(excess / totalBurn, 1)
        ctx.beginPath()
        ctx.arc(
          cx, cy, r,
          startAngle,
          startAngle + excessRatio * 2 * Math.PI
        )
        ctx.setStrokeStyle('#8e1a1a')
        ctx.setLineWidth(lineW)
        ctx.setLineCap('round')
        ctx.stroke()
      }

      // 目标缺口标记（蓝色小矩形）
      var targetIntake = totalBurn - target
      if (targetIntake > 0 && targetIntake < totalBurn) {
        var angle = startAngle + (targetIntake / totalBurn) * 2 * Math.PI
        var mx = cx + Math.cos(angle) * r
        var my = cy + Math.sin(angle) * r
        ctx.save()
        ctx.translate(mx, my)
        ctx.rotate(angle + Math.PI / 2)
        ctx.setFillStyle('#3498db')
        ctx.fillRect(-3, -7, 6, 14)
        ctx.restore()
      }
    }

    ctx.draw()
  },

  goRecord: function (e) {
    var action = e.currentTarget.dataset.action
    wx.setStorageSync('quickAction', action)
    wx.switchTab({ url: '/pages/record/index' })
  }
})
