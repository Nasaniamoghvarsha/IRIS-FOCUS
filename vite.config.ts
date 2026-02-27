import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@mediapipe/face_mesh'],
    include: ['@tensorflow/tfjs-core'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
