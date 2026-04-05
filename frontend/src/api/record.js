import { request } from './request'

export const recordApi = {
  // 获取指定日期记录（不传则为今天）
  getByDate(date = '') {
    return request({ url: '/record', data: date ? { date } : {} })
  },
  // 保存一条摄入或运动
  save(item) {
    return request({ url: '/record', method: 'POST', data: item })
  },
  // 删除记录，type: 'food' | 'exercise'
  remove(type, id) {
    return request({ url: `/record/${type}/${id}`, method: 'DELETE' })
  }
}
