import { request } from './request'

export const encourageApi = {
  /** 获取今日个性化鼓励消息 */
  getToday() {
    return request({ url: '/encourage' })
  }
}
