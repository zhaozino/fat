var request = require('../utils/request').request

var parseApi = {
  parse: function (text, imageUrl, mealType) {
    return request({
      url: '/parse',
      method: 'POST',
      data: { text: text, imageUrl: imageUrl, mealType: mealType }
    })
  }
}

module.exports = { parseApi: parseApi }
