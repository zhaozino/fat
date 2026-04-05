const BASE_URL = __API_BASE__

/**
 * 统一请求封装
 * - 自动附加 Authorization header
 * - 401 自动跳转登录页
 * - 返回 Promise<data>，异常统一 toast 提示
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.header
      },
      success(res) {
        if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/src/pages/login/index' })
          return reject(new Error('未登录'))
        }
        if (res.statusCode >= 400) {
          const msg = res.data?.message || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          return reject(new Error(msg))
        }
        resolve(res.data)
      },
      fail(err) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(err)
      }
    })
  })
}
