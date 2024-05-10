import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) =>{
  const root = process.cwd()
  const env = loadEnv(mode, root)
  console.log(env)
  return {
    plugins: [react()],
    server: {
      port: 3001,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true
        }
      }
    }
  }
})
