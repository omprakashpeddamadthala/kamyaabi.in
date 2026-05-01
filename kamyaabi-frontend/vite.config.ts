import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui/icons-material')) return 'mui-icons';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('react-router')) return 'router';
          if (id.includes('@reduxjs') || id.includes('react-redux') || id.includes('redux')) return 'redux';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('axios')) return 'axios';
          if (id.includes('date-fns')) return 'date-fns';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
