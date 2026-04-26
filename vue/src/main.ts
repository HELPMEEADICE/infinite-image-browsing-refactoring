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
import { aliases, md } from 'vuetify/iconsets/md'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md,
    },
  },
})

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

