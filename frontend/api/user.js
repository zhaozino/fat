var request = require('../utils/request').request

var userApi = {
  getProfile: function () {
    return request({ url: '/user/profile' })
  },
  saveProfile: function (data) {
    return request({ url: '/user/profile', method: 'POST', data: data })
  }
}

module.exports = { userApi: userApi }
