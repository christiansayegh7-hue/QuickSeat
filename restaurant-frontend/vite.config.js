import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Static files in public/ never need HMR, and replacing them from
      // Windows Explorer briefly creates a lock file that used to crash
      // the whole dev server (EBUSY on the temp file during the swap).
      ignored: ['**/public/**'],
    },
  },
})
