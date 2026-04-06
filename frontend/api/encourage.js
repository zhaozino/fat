var request = require('../utils/request').request

var encourageApi = {
  getToday: function () {
    return request({ url: '/encourage' })
  }
}

module.exports = { encourageApi: encourageApi }
