import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  define: {
    // H5 开发时走 Vite 代理（/api），生产用环境变量
    __API_BASE__: JSON.stringify(process.env.VITE_API_BASE || '/api')
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.99.2:30080',
        changeOrigin: true
      }
    }
  }
})
