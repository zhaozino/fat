var recordApi = require('../../api/record').recordApi
var calculator = require('../../utils/calculator')

var app = getApp()

Page({
  data: {
    quickDays: 7,
    startDate: '',
    endDate: '',
    records: [],
    summary: { avgDeficit: 0, achieveDays: 0, totalDeficit: 0, estWeightLoss: '0.00' },
    historyList: []
  },

  onShow: function () {
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 })
    if (!this.data.startDate) {
      this.selectQuickDays(7)
    } else {
      this.loadStats()
    }
  },

  onReady: function () {
    this.selectQuickDays(7)
  },

  selectQuick: function (e) {
    var days = e.currentTarget.dataset.days
    this.selectQuickDays(days)
  },

  selectQuickDays: function (days) {
    var today = new Date()
    var start = new Date(today)
    start.setDate(today.getDate() - days + 1)
    this.setData({
      quickDays: days,
      startDate: this.fmtDate(start),
      endDate: this.fmtDate(today)
    })
    this.loadStats()
  },

  onStartChange: function (e) {
    this.setData({ startDate: e.detail.value, quickDays: 0 })
    this.loadStats()
  },

  onEndChange: function (e) {
    this.setData({ endDate: e.detail.value, quickDays: 0 })
    this.loadStats()
  },

  fmtDate: function (d) {
    var m = d.getMonth() + 1
    var day = d.getDate()
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
  },

  loadStats: function () {
    var that = this
    if (!that.data.startDate || !that.data.endDate) return

    var start = new Date(that.data.startDate)
    var end = new Date(that.data.endDate)
    var dates = []
    for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(that.fmtDate(d))
    }

    var promises = dates.map(function (date) {
      return recordApi.getByDate(date).then(function (val) {
        return { status: 'fulfilled', value: val }
      }).catch(function () {
        return { status: 'rejected' }
      })
    })

    Promise.all(promises).then(function (results) {
      var rs = results.map(function (r, i) {
        return {
          date: dates[i],
          totalIntake: r.status === 'fulfilled' ? (r.value.totalIntake || 0) : 0,
          totalExercise: r.status === 'fulfilled' ? (r.value.totalExercise || 0) : 0,
          deficit: r.status === 'fulfilled' ? (r.value.deficit || 0) : 0
        }
      })

      var target = app.getTargetDeficit()
      var total = rs.reduce(function (s, r) { return s + r.deficit }, 0)
      var achieved = rs.filter(function (r) { return r.deficit >= target * 0.8 }).length

      var historyList = rs
        .filter(function (r) { return r.totalIntake > 0 })
        .reverse()
        .map(function (r) {
          var dd = new Date(r.date)
          return {
            date: r.date,
            totalIntake: r.totalIntake,
            totalExercise: r.totalExercise,
            deficit: r.deficit,
            totalIntakeRound: Math.round(r.totalIntake),
            totalExerciseRound: Math.round(r.totalExercise),
            deficitRound: Math.round(r.deficit),
            dateLabel: (dd.getMonth() + 1) + '月' + dd.getDate() + '日',
            achieved: r.deficit >= target
          }
        })

      that.setData({
        records: rs,
        summary: {
          avgDeficit: Math.round(total / (rs.length || 1)),
          achieveDays: achieved,
          totalDeficit: Math.round(total),
          estWeightLoss: calculator.estimateWeightLoss(total)
        },
        historyList: historyList
      })

      that.drawChart()
    })
  },

  drawChart: function () {
    var rs = this.data.records
    var ctx = wx.createCanvasContext('deficit-chart', this)
    var W = 330, H = 200
    var pad = { top: 20, right: 15, bottom: 30, left: 40 }
    var cw = W - pad.left - pad.right
    var ch = H - pad.top - pad.bottom

    ctx.clearRect(0, 0, W, H)
    if (rs.length === 0) { ctx.draw(); return }

    var target = app.getTargetDeficit() || 400
    var deficits = rs.map(function (r) { return r.deficit || 0 })
    var maxD = Math.max.apply(null, deficits.concat([target, 500]))
    var range = maxD || 1
    var barW = cw / rs.length
    var gap = Math.max(2, barW * 0.2)
    var bw = Math.max(6, barW - gap)

    // 横向网格线 + Y 轴标签
    ctx.setStrokeStyle('#eee')
    ctx.setLineWidth(1)
    ctx.setFillStyle('#7f8c8d')
    ctx.setFontSize(10)
    ctx.setTextAlign('right')
    for (var i = 0; i <= 4; i++) {
      var y = pad.top + (ch / 4) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(W - pad.right, y)
      ctx.stroke()
      var val = Math.round(maxD - (range / 4) * i)
      ctx.fillText(String(val), pad.left - 5, y + 4)
    }

    // 柱子
    rs.forEach(function (r, idx) {
      var x = pad.left + barW * idx + (barW - bw) / 2
      var d = r.deficit || 0
      var h = Math.max(2, (d / range) * ch)
      var yy = pad.top + ch - h
      var color = d >= target ? '#2ecc71' : (d > 0 ? '#f39c12' : '#bdc3c7')
      ctx.setFillStyle(color)
      ctx.fillRect(x, yy, bw, h)
    })

    // 目标缺口线
    var ty = pad.top + ch - (target / range) * ch
    ctx.setStrokeStyle('#e74c3c')
    ctx.setLineWidth(2)
    ctx.beginPath()
    ctx.moveTo(pad.left, ty)
    ctx.lineTo(W - pad.right, ty)
    ctx.stroke()

    // 目标文字
    ctx.setFillStyle('#e74c3c')
    ctx.setFontSize(11)
    ctx.setTextAlign('right')
    ctx.fillText('目标', W - pad.right, ty - 5)

    // X 轴日期
    ctx.setFillStyle('#7f8c8d')
    ctx.setFontSize(10)
    ctx.setTextAlign('center')
    rs.forEach(function (r, idx) {
      var x = pad.left + barW * idx + barW / 2
      var dd = new Date(r.date)
      ctx.fillText((dd.getMonth() + 1) + '/' + dd.getDate(), x, H - 10)
    })

    ctx.draw()
  }
})
