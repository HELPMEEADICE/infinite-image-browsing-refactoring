<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { getGlobalSetting, setAppFeSetting } from './api'
import { useGlobalStore, presistKeys } from './store/useGlobalStore'
import { useWorkspeaceSnapshot } from './store/useWorkspeaceSnapshot'
import { getQuickMovePaths } from '@/page/taskRecord/autoComplete'
import SplitViewTab from '@/page/SplitViewTab/SplitViewTab.vue'
import OrganizeJobsPanel from '@/components/OrganizeJobsPanel.vue'
import OrganizePreview from '@/page/OrganizeFiles/OrganizePreview.vue'
import SmartOrganizeConfigModal from '@/components/SmartOrganizeConfigModal.vue'
import PromptEditorModal from '@/components/PromptEditorModal.vue'
import MediaModal from '@/components/MediaModal.vue'
import TauriLaunchModal from '@/components/TauriLaunchModal.vue'
import UiSnackbarHost from '@/ui/UiSnackbarHost.vue'
import UiDialogHost from '@/ui/UiDialogHost.vue'
import { Dict, createReactiveQueue, globalEvents, useGlobalEventListen } from './util'
import { resolveQueryActions } from './queryActions'
import { refreshTauriConf, tauriConf } from './util/tauriAppConf'
import { isTauri } from './util/env'
import { delay } from 'vue3-ts-util'
import { exportFn } from './defineExportFunc'
import { debounce, once, cloneDeep } from 'lodash-es'
import { uiMessage } from './ui'
import { t } from './i18n'
import type { OrganizeFilesPreviewResp } from '@/api/organize'
import { getOrganizeFilesStatus } from '@/api/organize'

const globalStore = useGlobalStore()
const wsStore = useWorkspeaceSnapshot()
const queue = createReactiveQueue()

// Organize preview modal state
const showOrganizePreview = ref(false)
const currentOrganizePreview = ref<OrganizeFilesPreviewResp | null>(null)

// Moving progress state
const isMovingFiles = ref(false)
const movingProgress = ref({ moved: 0, total: 0 })

const handleOpenOrganizePreview = (job: any) => {
  console.log('handleOpenOrganizePreview received:', 'job_id:', job.job_id, 'status:', job.status, 'preview:', job.preview ? `yes (${job.preview.total_files} files)` : 'no')
  if (job.preview) {
    currentOrganizePreview.value = job.preview
    showOrganizePreview.value = true
    console.log('Modal opened with preview data')
  } else {
    console.warn('No preview data in job - job keys:', Object.keys(job))
  }
}

const handleOrganizePreviewConfirmed = async () => {
  showOrganizePreview.value = false
  const jobId = currentOrganizePreview.value?.job_id
  const folderPaths = globalStore.getOrganizeJob(jobId || '')?.folder_paths || []
  currentOrganizePreview.value = null

  if (!jobId) return

  // Start polling for moving progress with fullscreen loading
  isMovingFiles.value = true
  movingProgress.value = { moved: 0, total: 0 }

  const pollMoving = async () => {
    try {
      const status = await getOrganizeFilesStatus(jobId)

      if (status.status === 'moving') {
        movingProgress.value = {
          moved: status.progress?.moved_done || 0,
          total: status.progress?.moved_total || 0
        }
        setTimeout(pollMoving, 500)
      } else if (status.status === 'done') {
        // Done - close loading, remove job, refresh view
        isMovingFiles.value = false
        globalStore.removeOrganizeJob(jobId)
        uiMessage.success(t('organizeComplete'))
        // Trigger refresh
        globalEvents.emit('refreshFileView', { paths: folderPaths })
      } else if (status.status === 'error') {
        isMovingFiles.value = false
        uiMessage.error(`${t('organizeFailed')}: ${status.error}`)
      } else {
        // Still in other status, keep polling
        setTimeout(pollMoving, 500)
      }
    } catch (e: any) {
      console.error('Poll moving status error:', e)
      setTimeout(pollMoving, 1000)
    }
  }

  pollMoving()
}

const handleOrganizePreviewCancel = () => {
  showOrganizePreview.value = false
  currentOrganizePreview.value = null
}

const presistKeysFiltered = presistKeys.filter(v => !['tabListHistoryRecord', 'recent'].includes(v))

let lastConf = null as any
const watchGlobalSettingChange = once(async () => {
  globalStore.$subscribe((debounce(async () => {
    if (globalStore.conf?.is_readonly === true) {
      return
    }
    const conf = {} as Dict
    presistKeysFiltered.forEach((key) => {
      conf[key] = cloneDeep((globalStore as any)[key])
    })
    if (JSON.stringify(conf) === JSON.stringify(lastConf)) {
      return
    }
    console.log('save global setting', conf)
    await setAppFeSetting('global', conf)
    lastConf = cloneDeep(conf)
  }, 500)))


})

const restoreWorkspaceSnapshot = once( async () => {
  await delay(100)
  const initPage = globalStore.defaultInitinalPage
  if (initPage === 'empty') {
    return
  }
  if (initPage === 'last-workspace-state') {
    const last = globalStore.tabListHistoryRecord?.[1]
    if (!last?.tabs) {
      return
    }
    globalStore.tabList = cloneDeep(last.tabs)
    uiMessage.success(t('restoreLastWorkspaceStateSuccess'))
  } else {
    const id = initPage.split('_')?.[2]
    const shot = wsStore.snapshots.find(v => v.id === id)
    if (!shot?.tabs) {
      return
    }
    globalStore.tabList = cloneDeep(shot.tabs)
    uiMessage.success(t('restoreWorkspaceSnapshotSuccess'))
  }

})



useGlobalEventListen('updateGlobalSetting', async () => {
  await refreshTauriConf()
  console.log(tauriConf.value)
  const resp = await getGlobalSetting()
  globalStore.conf = resp
  const r = await getQuickMovePaths(resp)
  globalStore.quickMovePaths = r.filter((v) => v?.dir?.trim?.())

  const restoreFeGlobalSetting = globalStore?.conf?.app_fe_setting?.global
  if (restoreFeGlobalSetting) {
    console.log('restoreFeGlobalSetting', restoreFeGlobalSetting)
    lastConf = cloneDeep(restoreFeGlobalSetting)
    presistKeysFiltered.forEach((key) => {
      const v = restoreFeGlobalSetting[key]
      if (v !== undefined) {
        (globalStore as any)[key] = v
      }
    })
  }
  watchGlobalSettingChange()
  restoreWorkspaceSnapshot()
  exportFn(globalStore)
  resolveQueryActions(globalStore)
  // globalEvents.emit('updateGlobalSettingDone')
})



useGlobalEventListen('returnToIIB', async () => {
  const conf = globalStore.conf
  if (!conf) {
    return
  }
  const gs = conf.global_setting
  if (!gs.outdir_txt2img_samples && !gs.outdir_img2img_samples) {
    return
  }
  const set = new Set(globalStore.quickMovePaths.map(v => v.key))
  if (set.has('outdir_txt2img_samples') && set.has('outdir_img2img_samples')) {
    return
  }
  const r = await getQuickMovePaths(conf)
  globalStore.quickMovePaths = r.filter((v) => v?.dir?.trim?.())
})



watch(
  () => globalStore.computedTheme === 'dark',
  async (enableDark) => {
    await delay()
    if (enableDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  },
  { immediate: true }
)

watch(() => globalStore.previewBgOpacity, (v) => {
  document.documentElement.style.setProperty('--iib-preview-mask-bg', `rgba(0, 0, 0, ${v})`)
}, { immediate: true })

onMounted(async () => {
  globalEvents.emit('updateGlobalSetting')
})
</script>

<template>
  <v-skeleton-loader v-if="!queue.isIdle" type="article" />
  <SplitViewTab v-else />

  <!-- Snackbar Host for uiMessage API -->
  <UiSnackbarHost />

  <!-- Dialog Host for uiDialog API -->
  <UiDialogHost />

  <!-- Organize Jobs Progress Panel -->
  <OrganizeJobsPanel @open-preview="handleOpenOrganizePreview" />

  <!-- Organize Preview Modal -->
  <v-dialog v-model="showOrganizePreview" :width="800" scrollable>
    <v-card v-if="currentOrganizePreview">
      <v-card-title>{{ t('smartOrganizePreview') }}</v-card-title>
      <v-card-text>
        <OrganizePreview
          :preview="currentOrganizePreview"
          @cancel="handleOrganizePreviewCancel"
          @confirmed="handleOrganizePreviewConfirmed"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Smart Organize Config Modal -->
  <SmartOrganizeConfigModal />

  <!-- Prompt Editor Modal (自包含组件，通过全局事件控制) -->
  <PromptEditorModal />

  <!-- Fullscreen Loading for Moving Files -->
  <div v-if="isMovingFiles" class="moving-files-overlay">
    <div class="moving-files-content">
      <v-progress-circular indeterminate size="48" color="white" />
      <div class="moving-text">{{ t('movingFiles') }}</div>
      <div class="moving-progress">
        {{ movingProgress.moved }} / {{ movingProgress.total }}
      </div>
    </div>
  </div>

  <!-- Media Modal (video/audio playback with tags and prompt) -->
  <MediaModal />

  <!-- Tauri Launch Config Modal -->
  <TauriLaunchModal v-if="isTauri" />
</template>

<style>
.moving-files-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.moving-files-content {
  text-align: center;
  color: #fff;
}

.moving-text {
  margin-top: 16px;
  font-size: 18px;
}

.moving-progress {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
