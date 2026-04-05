import { request } from './request'

export const userApi = {
  getProfile() {
    return request({ url: '/user/profile' })
  },
  saveProfile(data) {
    return request({ url: '/user/profile', method: 'POST', data })
  }
}
