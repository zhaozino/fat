var request = require('../utils/request').request

var fileApi = {
  getUploadToken: function () {
    return request({ url: '/file/upload-token' })
  },

  uploadToCos: function (token, filePath) {
    return new Promise(function (resolve, reject) {
      var ext = filePath.split('.').pop() || 'jpg'
      var fileName = Date.now() + '.' + ext
      var key = token.keyPrefix + fileName
      var url = 'https://' + token.bucket + '.cos.' + token.region + '.myqcloud.com/' + key

      wx.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        header: {
          'x-cos-security-token': token.sessionToken,
          Authorization: ''
        },
        success: function (res) {
          if (res.statusCode === 200 || res.statusCode === 204) {
            resolve(url)
          } else {
            reject(new Error('COS 上传失败：' + res.statusCode))
          }
        },
        fail: reject
      })
    })
  }
}

module.exports = { fileApi: fileApi }
