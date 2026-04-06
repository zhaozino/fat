const { BASE_URL } = require('./config')

function request(options) {
  return new Promise(function (resolve, reject) {
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: Object.assign(
        { 'Content-Type': 'application/json' },
        token ? { Authorization: 'Bearer ' + token } : {},
        options.header || {}
      ),
      success: function (res) {
        if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.reLaunch({ url: '/pages/login/index' })
          return reject(new Error('未登录'))
        }
        if (res.statusCode >= 400) {
          var msg = (res.data && res.data.message) || '请求失败'
          wx.showToast({ title: msg, icon: 'none' })
          return reject(new Error(msg))
        }
        resolve(res.data)
      },
      fail: function (err) {
        wx.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = { request: request }
