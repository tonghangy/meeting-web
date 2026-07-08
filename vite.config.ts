import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** 本地：https://127.0.0.1:5173/app/ ；API 同源 /app/api 代理到 http://127.0.0.1:8088 */
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/app/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    https: true,
    proxy: {
      '/app/api': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
