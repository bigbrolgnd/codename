/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import sri from 'vite-plugin-sri'

import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sri(),
  ],
  build: {
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setup-tests.ts",
  },
})
