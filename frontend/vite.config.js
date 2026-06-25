import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force a single React instance – prevents "Invalid hook call" errors
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/icons-material')) return 'mui-icons';
            if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@emotion')) {
              return 'mui-core';
            }
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('react-router') || id.includes('react-redux') || id.includes('@reduxjs')) {
              return 'react-vendor';
            }
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        timeout: 600000,      // 10 min connection timeout
        proxyTimeout: 600000, // 10 min proxy socket timeout
      },
    },
  },
});
