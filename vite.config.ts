import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  server: {
    port: 5173,
    proxy: {
      '/app/api': {
        target: 'http://43.143.218.217:8099',
        changeOrigin: true,
      },
    },
  },
});
