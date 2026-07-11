import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function removeCrossorigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replaceAll(' crossorigin', '')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), removeCrossorigin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'react-vendor'
          if (id.includes('node_modules/@radix-ui/')) return 'ui-vendor'
          if (id.includes('node_modules/zustand')) return 'state-vendor'
          if (id.includes('node_modules/lucide-react')) return 'icon-vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
