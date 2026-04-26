<script setup lang="ts">
import { t } from '@/i18n'
import { useGlobalStore, type Shortcut, type DefaultInitinalPage } from '@/store/useGlobalStore'
import { useWorkspeaceSnapshot } from '@/store/useWorkspeaceSnapshot'
import { computed, ref } from 'vue'
import { SearchSelect} from 'vue3-ts-util'
import { sortMethodConv, sortMethods } from '@/page/fileTransfer/fileSort'
import { relaunch } from '@tauri-apps/api/process'
const appConfFilename = 'app.conf.json'
import { fs, invoke } from '@tauri-apps/api'
import { getShortcutStrFromEvent } from '@/util/shortcut'
import { isTauri } from '@/util/env'
import ImageSetting from './ImageSetting.vue'
import AutoTagSettings from './AutoTagSettings.vue'
import { openRebuildImageIndexModal } from '@/components/functionalCallableComp'
import { Dict } from '@/util'
import { uiMessage } from '@/ui'
import { throttle, debounce } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import { prefix } from '@/util/const'

const globalStore = useGlobalStore()
const wsStore = useWorkspeaceSnapshot()

const langChanged = ref(false)
const reload = async () => {
  window.location.reload()
}
const langs: { text: string, value: string }[] = [
  { value: 'en', text: 'English' },
  { value: 'zhHans', text: '简体中文' },
  { value: 'zhHant', text: '繁體中文' },
  { value: 'de', text: 'Deutsch' }
]
const doubleCheck = debounce((key: keyof Shortcut) => {
  
  const keysStr = globalStore.shortcut[key] as string
  if (['ctrl', 'shift'].includes(keysStr.toLowerCase())) {
    globalStore.shortcut[key] = ''
  }
}, 700)
const simpleKeyWarn = throttle(() => {
  uiMessage.warning(t('notAllowSingleCtrlOrShiftAsShortcut'))
}, 3000)
const onShortcutKeyDown = (e: KeyboardEvent, key: keyof Shortcut) => {
  const keysStr = getShortcutStrFromEvent(e)
  if (['ctrl', 'shift'].includes(keysStr.toLowerCase())) {
    simpleKeyWarn()
    doubleCheck(key)
  }
  if (keysStr) {
    globalStore.shortcut[key] = keysStr
  }
}

const oninitTauriLaunchConf = async () => {
  await invoke('shutdown_api_server_command')
  await fs.removeFile(appConfFilename)
  await relaunch()
}

const defaultInitinalPageOptions = computed(() => {
  const r: { text: string, value: DefaultInitinalPage }[] = [
    { value: 'empty', text: t('emptyStartPage') },
    { value: 'last-workspace-state', text: t('restoreLastWorkspaceState') },
    ...wsStore.snapshots.map(item => ({ value: `workspace_snapshot_${item.id}` as `workspace_snapshot_${string}`, text: t('restoreWorkspaceSnapshot', [item.name]) }))
  ]
  return r
})
const shortCutsCountRec = computed(() => {
  const rec = globalStore.shortcut
  const res = {} as Dict<number>
  Object.values(rec).forEach((v) => {
    res[v + ''] ??= 0
    res[v + '']++
  })
  return res
})

const shortcutsList = computed(() => {
  const res = [{ key: 'download', label: t('download') }, { key: 'delete', label: t('deleteSelected') }] as { key: keyof Shortcut, label: string }[]
  globalStore.conf?.all_custom_tags.forEach(tag => {
    res.push({ key: `toggle_tag_${tag.name}`, label: t('toggleTagSelection', { tag: tag.name }) })
  })
  globalStore.quickMovePaths.forEach(item => {
    res.push({ key: `copy_to_${item.dir}`, label: t('copyTo') + ' ' + item.zh })
  })
  globalStore.quickMovePaths.forEach(item => {
    res.push({ key: `move_to_${item.dir}`, label: t('moveTo') + ' ' + item.zh })
  })
  return res
})

const isShortcutConflict = (keyStr: string) => {
  return keyStr && keyStr in shortCutsCountRec.value && shortCutsCountRec.value[keyStr] > 1
}
const disableMaximize = useLocalStorage(prefix+'disable_maximize', false)
const showPresetShortcutModal = ref(false)
const presetShortcutGroups = computed(() => ([
  {
    title: t('shortcutPresetSectionBrowse'),
    items: [
      {
        keys: 'PageUp / PageDown',
        location: t('shortcutPresetLocationFileList'),
        action: t('shortcutPresetActionPageJump')
      },
      {
        keys: 'Home / End',
        location: t('shortcutPresetLocationFileList'),
        action: t('shortcutPresetActionHomeEnd')
      },
      {
        keys: 'Backspace',
        location: t('shortcutPresetLocationFileList'),
        action: t('shortcutPresetActionBackspaceUp')
      },
      {
        keys: 'Ctrl + A / Cmd + A',
        location: t('shortcutPresetLocationFileList'),
        action: t('shortcutPresetActionSelectAll')
      }
    ]
  },
  {
    title: t('shortcutPresetSectionFullscreen'),
    items: [
      {
        keys: 'ArrowLeft / ArrowRight / ArrowUp / ArrowDown',
        location: t('shortcutPresetLocationFullscreen'),
        action: t('shortcutPresetActionFullscreenNavigate')
      },
      {
        keys: 'Esc',
        location: t('shortcutPresetLocationFullscreen'),
        action: t('shortcutPresetActionFullscreenExit')
      }
    ]
  },
  {
    title: t('shortcutPresetSectionTiktok'),
    items: [
      {
        keys: 'ArrowUp / ArrowDown',
        location: t('shortcutPresetLocationTiktok'),
        action: t('shortcutPresetActionTiktokNavigate')
      },
      {
        keys: 'Esc',
        location: t('shortcutPresetLocationTiktok'),
        action: t('shortcutPresetActionTiktokExit')
      }
    ]
  }
]))

// 自然语言分类&搜索 已提升到首页启动入口（TopicSearch），全局设置不再保留旧入口
</script>
<template>
  <div class="panel">
    <v-alert :text="$t('readonlyModeSettingPageDesc')" v-if="globalStore.conf?.is_readonly" color="warning" icon />
    <v-select v-if="false" hide-details />
    <div>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('lang') }}
        <div class="lang-select-wrap">
          <SearchSelect :options="langs" v-model:value="globalStore.lang" @change="langChanged = true" />
        </div>
        <v-btn color="primary" @click="reload" v-if="langChanged" variant="outlined">{{
          t('langChangeReload')
          }}</v-btn>
      </v-label>
      <h2 style="margin-top: 64px;">{{ t('ImageBrowsingSettings') }}</h2>
      <ImageSetting />
      
      <h2 style="margin-top: 64px;">{{ t('autoTag.name') }}</h2>
      <AutoTagSettings />

      <h2>TikTok {{ t('view') }}</h2>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('showTiktokNavigator') }}
        <v-switch v-model="globalStore.showTiktokNavigator" hide-details />
        <span style="margin-left: 8px;color: #666;">{{ t('showTiktokNavigatorDesc') }}</span>
      </v-label>

      <h2>{{ t('imgSearch') }}</h2>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('rebuildImageIndex') }}
        <v-btn @click="openRebuildImageIndexModal">{{ $t('start') }}</v-btn>
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('autoUpdateIndex') }}
        <v-switch v-model="globalStore.autoUpdateIndex" hide-details />
        <span style="margin-left: 8px;color: #666;">{{ t('autoUpdateIndexDesc') }}</span>
      </v-label>

      <h2>{{ t('autoRefresh') }}</h2>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('autoRefreshWalkMode') }}
        <v-switch v-model="globalStore.autoRefreshWalkMode" hide-details />
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('autoRefreshNormalFixedMode') }}
        <v-switch v-model="globalStore.autoRefreshNormalFixedMode" hide-details />
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ t('autoRefreshWalkModePosLimit') }}
        <NumInput :min="0" :max="1024" :step="16" v-model="globalStore.autoRefreshWalkModePosLimit" />
      </v-label>

      <h2 style="margin-top: 0;">{{ t('other') }}</h2>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('fileTypeFilter') }}
        <div class="d-flex ga-2">
          <v-checkbox :label="$t('allFiles')" value="all" v-model="globalStore.fileTypeFilter" hide-details />
          <v-checkbox :label="$t('image')" value="image" v-model="globalStore.fileTypeFilter" hide-details />
          <v-checkbox :label="$t('video')" value="video" v-model="globalStore.fileTypeFilter" hide-details />
          <v-checkbox :label="$t('audio')" value="audio" v-model="globalStore.fileTypeFilter" hide-details />
        </div>
      </v-label>
      <!--在生成信息面板显示逗号-->
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('showCommaInGenInfoPanel') }}
        <v-switch v-model="globalStore.showCommaInInfoPanel" hide-details />
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('showRandomImageInStartup') }}
        <v-switch v-model="globalStore.showRandomImageInStartup" hide-details />
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('defaultSortingMethod') }}
        <search-select v-model:value="globalStore.defaultSortingMethod" :conv="sortMethodConv" :options="sortMethods" />
      </v-label>

      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('longPressOpenContextMenu') }}
        <v-switch v-model="globalStore.longPressOpenContextMenu" hide-details />
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('openOnAppStart') }}
        <search-select v-model:value="globalStore.defaultInitinalPage" :options="defaultInitinalPageOptions" />
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4" v-for="_, key in globalStore.ignoredConfirmActions" :key="key">
        {{ $t(key + 'SkipConfirm') }}
        <v-checkbox v-model="globalStore.ignoredConfirmActions[key]" hide-details></v-checkbox>
      </v-label>
      <v-label class="d-flex align-center ga-4 mb-4">
        {{ $t('disableMaximize') }}
        <v-switch v-model="disableMaximize" hide-details />
        <sub style="padding-left: 8px;color: #666;">{{ $t('takeEffectAfterReloadPage') }}</sub>
      </v-label>

      

      <v-dialog v-model="showPresetShortcutModal" width="800px">
        <div class="shortcut-preset-desc">{{ t('shortcutPresetDesc') }}</div>
        <div class="shortcut-preset-section" v-for="group in presetShortcutGroups" :key="group.title">
          <div class="shortcut-preset-section-title">{{ group.title }}</div>
          <div class="shortcut-preset-grid shortcut-preset-grid-header">
            <div>{{ t('shortcutPresetHeaderKey') }}</div>
            <div>{{ t('shortcutPresetHeaderWhere') }}</div>
            <div>{{ t('shortcutPresetHeaderAction') }}</div>
          </div>
          <div class="shortcut-preset-grid" v-for="item in group.items" :key="item.keys + item.action">
            <div class="mono">{{ item.keys }}</div>
            <div>{{ item.location }}</div>
            <div>{{ item.action }}</div>
          </div>
        </div>
      </v-dialog>
      <div class="shortcut-title-row">
        <h2>{{ t('shortcutKey') }}</h2>
      </div>
        <v-btn variant="text" @click="showPresetShortcutModal = true">
          {{ t('shortcutPresetButton') }}
        </v-btn>
      <v-label class="d-flex align-center ga-4 mb-4" v-for="item in shortcutsList" :key="item.key">
        {{ item.label }}
        <div class="col" :class="{ conflict: isShortcutConflict(globalStore.shortcut[item.key] + '') }"

          @keydown.stop.prevent>
          <v-text-field :model-value="globalStore.shortcut[item.key]" @keydown.stop.prevent="onShortcutKeyDown($event, item.key)"
            :placeholder="$t('shortcutKeyDescription')" hide-details />
          <v-btn @click="globalStore.shortcut[item.key] = ''" class="clear-btn">
            {{ $t('clear') }}
          </v-btn>
        </div>
      </v-label>
      <template v-if="isTauri">
        <h2>{{ t('clientSpecificSettings') }}</h2>
        <div class="d-flex align-center ga-4 mb-4">
          <div class="col">
            <v-btn @click="oninitTauriLaunchConf" class="clear-btn">
              {{ $t('initiateSoftwareStartupConfig') }}
            </v-btn>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.panel {
  padding: 8px;
  margin: 16px;
  border-radius: 8px;
  background: var(--zp-primary-background);
  overflow: auto;
  height: calc(100% - 32px);

  &> :not(:first-child) {
    margin-left: 16px;
  }
}

.lang-select-wrap {
  width: 128px;
  display: inline-block;
  padding-right: 16px;
}

h2 {
  margin: 64px 0 16px;
  font-weight: bold;
}

.shortcut-title-row {
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    margin: 64px 0 16px;
  }
}

.shortcut-preset-desc {
  color: #666;
  margin-bottom: 12px;
}

.shortcut-preset-section {
  margin-top: 16px;
}

.shortcut-preset-section-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.shortcut-preset-grid {
  display: grid;
  grid-template-columns: 220px 240px 1fr;
  gap: 8px 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--zp-secondary-background);
}

.shortcut-preset-grid-header {
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid var(--zp-secondary-background);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.row {
  margin-top: 16px;
  padding: 0 16px;
}

.col {
  display: flex;

  &.conflict {
    border-bottom: 1px solid red;
    position: relative;

    &::after {
      position: absolute;
      top: -16px;
      left: 0;
      background: white;
      color: red;
      content: 'conflict';
    }
  }
}

.clear-btn {
  margin-left: 16px;
}
</style>
