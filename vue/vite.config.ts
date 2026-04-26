import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vuetify from 'vite-plugin-vuetify'
import { env } from 'node:process'
const isProd = env.NODE_ENV === 'production'
const isDev = !isProd
const isTauri = !!env.TAURI_ARCH
// https://vitejs.dev/config/

export default defineConfig({
  base: isDev || isTauri ? '/' : '/infinite_image_browsing/fe-static/',

  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [
    vue({ script: { defineModel: true }  }),
    vueJsx(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3002,
    proxy: {
      '/infinite_image_browsing/': {
        target: 'http://127.0.0.1:7866/'
      }
    }
  }
})
