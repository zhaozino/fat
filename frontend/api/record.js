var request = require('../utils/request').request

var recordApi = {
  getByDate: function (date) {
    return request({ url: '/record', data: date ? { date: date } : {} })
  },
  save: function (item) {
    return request({ url: '/record', method: 'POST', data: item })
  },
  remove: function (type, id) {
    return request({ url: '/record/' + type + '/' + id, method: 'DELETE' })
  }
}

module.exports = { recordApi: recordApi }
