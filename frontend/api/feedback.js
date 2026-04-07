var request = require('../utils/request').request

var feedbackApi = {
  submit: function (content) {
    return request({ url: '/feedback', method: 'POST', data: { content: content } })
  }
}

module.exports = { feedbackApi: feedbackApi }
