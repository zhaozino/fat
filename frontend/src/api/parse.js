import { request } from './request'

export const parseApi = {
  /**
   * 解析食物/运动文字或图片
   * @param {string} text      用户输入文字（可选）
   * @param {string} imageUrl  COS 图片地址（可选）
   * @param {string} mealType  meal 类型（可选）
   */
  parse(text, imageUrl, mealType) {
    return request({
      url: '/parse',
      method: 'POST',
      data: { text, imageUrl, mealType }
    })
  }
}
