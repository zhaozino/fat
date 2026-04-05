import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 小程序必须用完整域名，H5 可以用相对路径走代理
const API_BASE = process.env.VITE_API_BASE || (
  process.env.UNI_PLATFORM === 'mp-weixin'
    ? 'http://192.168.3.180:30080/api'  // 小程序：直连后端
    : '/api'                             // H5：走 Vite 代理
)

export default defineConfig({
  plugins: [uni()],
  define: {
    __API_BASE__: JSON.stringify(API_BASE)
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.3.180:30080',
        changeOrigin: true
      }
    }
  }
})
