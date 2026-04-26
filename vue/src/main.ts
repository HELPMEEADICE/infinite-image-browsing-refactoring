import { createApp } from 'vue'
// @ts-ignore
import App from './App.vue'
import './index.scss'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './i18n'
import VueDiff from 'vue-diff'

import 'vue-diff/dist/index.css'

import 'vuetify/styles'
import 'material-symbols/outlined.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#d03f0a',
          error: '#fa114f',
          info: '#17a2b8',
          success: '#28a745',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#1890ff',
          error: '#fa114f',
          info: '#17a2b8',
          success: '#28a745',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

export { vuetify }

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App)
  .use(pinia)
  .use(i18n)
  .use(VueDiff, {
    componentName: 'VueDiff',
  })
  .use(vuetify)
  .mount('#zanllp_dev_gradio_fe')

