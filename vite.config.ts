import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist'
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectRegister: false,
        manifest: false,
        includeAssets: [
          'favicon.svg',
          'pwa_icon_512.png',
          'pwa_icon_192.png',
          'screenshot1.png',
          'screenshot2.png',
          'screenshot_desktop.png',
          'recycle-sign.png',
          'traffic_signal.png',
          'offline.html',
          'manifest.json'
        ],
        injectManifest: {
          injectionPoint: 'self.__WB_MANIFEST',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,csv}'],
          maximumFileSizeToCacheInBytes: 5000000,
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
