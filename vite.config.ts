import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      output: { banner: '"use client";' },
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
})
