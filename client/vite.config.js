import { defineConfig } from "vite";

const isDev = process.env?.NODE_ENV !== 'production';
const PROXY = 7777;

export default defineConfig({
    server: {
        open: true,
        port: 3000,
        host: '0.0.0.0',
        proxy: isDev ? { '/api': `http://localhost:${PROXY}`} : {}
    }
    
});