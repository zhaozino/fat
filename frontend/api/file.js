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
      console.log('[COS上传] 开始上传')
      console.log('[COS上传] uploadUrl:', presignedResp.uploadUrl)
      console.log('[COS上传] fileUrl:', fileUrl)
      console.log('[COS上传] filePath:', filePath)

      // 先获取文件内容，再用 wx.request PUT 上传
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        success: function (fileRes) {
          console.log('[COS上传] 读取文件成功, 大小:', fileRes.data.byteLength)

          wx.request({
            url: presignedResp.uploadUrl,
            method: 'PUT',
            data: fileRes.data,
            header: {
              'Content-Type': 'image/png'
            },
            success: function (res) {
              console.log('[COS上传] 响应状态码:', res.statusCode)
              console.log('[COS上传] 响应数据:', res.data)
              if (res.statusCode === 200 || res.statusCode === 204) {
                resolve(fileUrl)
              } else {
                reject(new Error('上传失败：' + res.statusCode + ', ' + JSON.stringify(res.data)))
              }
            },
            fail: function (err) {
              console.error('[COS上传] 请求失败:', err)
              reject(err)
            }
          })
        },
        fail: function (err) {
          console.error('[COS上传] 读取文件失败:', err)
          reject(err)
        }
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
