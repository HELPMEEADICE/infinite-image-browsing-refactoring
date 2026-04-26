<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { open } from '@tauri-apps/api/dialog'
import { fs } from '@tauri-apps/api'
import { relaunch } from '@tauri-apps/api/process'
import { delay } from 'vue3-ts-util'
import { t } from '@/i18n'
import { invoke } from '@tauri-apps/api/tauri'
import { uiMessage } from '@/ui'

const appConfFilename = 'app.conf.json'

const visible = ref(false)
const sdwebuiDir = ref('')

const save = async () => {
  const conf = { sdwebui_dir: sdwebuiDir.value }
  return fs.writeFile(appConfFilename, JSON.stringify(conf, null, 4))
}

const tryOpen = async () => {
  try {
    const conf = JSON.parse(await fs.readTextFile(appConfFilename))
    sdwebuiDir.value = conf.sdwebui_dir || ''
  } catch { /* empty */ }
  if (!sdwebuiDir.value) {
    visible.value = true
  }
}

const onSelectSdWebuiClick = async () => {
  const dir = await open({ directory: true })
  if (typeof dir === 'string') {
    if (!(await fs.exists(`${dir}/config.json`))) {
      uiMessage.error(t('tauriLaunchConfMessages.configNotFound'))
      return
    }
    if (!(await fs.exists(`${dir}/extensions/sd-webui-infinite-image-browsing`))) {
      uiMessage.error(t('tauriLaunchConfMessages.folderNotFound'))
      return
    }
    sdwebuiDir.value = dir
    await save()
    uiMessage.info(t('tauriLaunchConfMessages.configCompletedMessage'))
    await invoke('shutdown_api_server_command')
    await delay(1500)
    await relaunch()
  }
}

onMounted(tryOpen)
</script>

<template>
  <v-dialog v-model="visible" width="80vw" max-width="720" persistent>
    <v-card>
      <v-card-title>{{ t('tauriLaunchConfMessages.firstTimeUserTitle') }}</v-card-title>
      <v-card-text>
        <div style="padding: 16px 0;">
          <h3>{{ t('tauriLaunchConf.readSdWebuiConfigTitle') }}</h3>
          <p>{{ t('tauriLaunchConf.readSdWebuiConfigDescription') }}</p>
          <v-btn color="primary" @click="onSelectSdWebuiClick">
            {{ t('tauriLaunchConf.selectSdWebuiFolder') }}
          </v-btn>
        </div>
        <div style="padding: 16px 0;">
          <h3>{{ t('tauriLaunchConf.skipThisConfigTitle') }}</h3>
          <p>{{ t('tauriLaunchConf.skipThisConfigDescription') }}</p>
          <v-btn color="primary" @click="visible = false">
            {{ t('tauriLaunchConf.skipButton') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
