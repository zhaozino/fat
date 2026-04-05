import { request } from './request'

export const fileApi = {
  /** 获取 COS STS 临时上传凭证 */
  getUploadToken() {
    return request({ url: '/file/upload-token' })
  },

  /**
   * 使用 STS 凭证将图片直传到 COS
   * @param {object} token  getUploadToken() 返回的凭证
   * @param {string} filePath  uni.chooseImage 返回的临时路径
   * @returns {Promise<string>} 图片的 COS 访问 URL
   */
  uploadToCos(token, filePath) {
    return new Promise((resolve, reject) => {
      const ext      = filePath.split('.').pop() || 'jpg'
      const fileName = Date.now() + '.' + ext
      const key      = token.keyPrefix + fileName
      const url      = `https://${token.bucket}.cos.${token.region}.myqcloud.com/${key}`

      uni.uploadFile({
        url,
        filePath,
        name: 'file',
        header: {
          'x-cos-security-token': token.sessionToken,
          Authorization: buildCosAuth(token, key)
        },
        success(res) {
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

/**
 * 简单 COS 签名（小程序直传用）
 * 生产环境建议使用 cos-wx-sdk-v5
 */
function buildCosAuth(token, key) {
  // 小程序端推荐直接使用 cos-wx-sdk-v5，这里返回空让服务端 STS token 授权
  // 实际项目中请集成: https://github.com/tencentyun/cos-wx-sdk-v5
  return ''
}
