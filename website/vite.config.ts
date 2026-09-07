import { defineConfig } from 'vite'
export default defineConfig(({ mode }) => ({
  root: 'website',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  resolve: {
    alias:
      mode === 'profiling' ? { 'react-dom/client': 'react-dom/profiling' } : {},
  },
  build: {
    outDir: mode === 'profiling' ? 'dist-profiling' : 'dist',
    emptyOutDir: true,
  },
}))
