import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      }
      // OpenAI 프록시 제거됨 - 백엔드 Gateway 사용
    },
    plugins: [react()],
    // API 키 번들 주입 제거됨 - 백엔드 Gateway 사용
    resolve: {
      alias: {
        '@': path.resolve('src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],

            // UI libraries
            'ui-vendor': ['lucide-react', 'sonner'],

            // Markdown and syntax highlighting
            'markdown-vendor': ['react-markdown', 'remark-gfm', 'react-syntax-highlighter'],

            // Firebase
            'firebase-vendor': ['firebase/app', 'firebase/auth'],

            // AI services
            'ai-vendor': ['@google/genai']
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000
    }
  };
});