import { defineConfig } from 'vite';
import path from 'path-browserify';

const isDev = process.env?.NODE_ENV !== 'production';
const PROXY = 7777;

export default defineConfig({
  server: {
    open: true,
    port: 3000,
    host: '0.0.0.0',
    proxy: isDev ? { '/api': `http://localhost:${PROXY}` } : {},
  },
   resolve: {
    alias: {
      // Заменяем Node.js-модуль 'path' на браузерную версию
      path: 'path-browserify',
    },
  },
});
