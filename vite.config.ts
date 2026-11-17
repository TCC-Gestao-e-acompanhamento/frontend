import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Publicação em subcaminho (ex.: GitHub Pages em /nome-do-repo/). Local e em domínio próprio fica "/".
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
