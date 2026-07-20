import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/directus': {
          target: 'http://directus-v2bpvu6wqgna8fbsczs76x4n.89.42.199.190.sslip.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/directus/, ''),
        },
      },
    },
  };
});
