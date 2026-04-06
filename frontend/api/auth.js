var request = require('../utils/request').request

var authApi = {
  sendSms: function (phone) {
    return request({ url: '/auth/send-sms', method: 'POST', data: { phone: phone } })
  },
  verify: function (phone, code) {
    return request({ url: '/auth/verify', method: 'POST', data: { phone: phone, code: code } })
  }
}

module.exports = { authApi: authApi }
