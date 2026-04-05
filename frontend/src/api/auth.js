import { request } from './request'

export const authApi = {
  sendSms(phone) {
    return request({ url: '/auth/send-sms', method: 'POST', data: { phone } })
  },
  verify(phone, code) {
    return request({ url: '/auth/verify', method: 'POST', data: { phone, code } })
  }
}
