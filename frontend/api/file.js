var request = require('../utils/request').request

var fileApi = {
  // 获取预签名上传 URL
  getUploadUrl: function (ext) {
    return request({ url: '/file/upload-url', data: ext ? { ext: ext } : {} })
  },

  // 使用预签名 URL 上传（PUT 方式）
  uploadWithPresignedUrl: function (presignedResp, filePath) {
    return new Promise(function (resolve, reject) {
      var fileUrl = presignedResp.fileUrl

      wx.uploadFile({
        url: presignedResp.uploadUrl,
        filePath: filePath,
        name: 'file',
        method: 'PUT',
        success: function (res) {
          if (res.statusCode === 200 || res.statusCode === 204) {
            resolve(fileUrl)
          } else {
            reject(new Error('上传失败：' + res.statusCode))
          }
        },
        fail: reject
      })
    })
  },

  // 旧的 STS 方式（保留兼容）
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
