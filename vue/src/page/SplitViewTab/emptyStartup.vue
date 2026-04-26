<script lang="ts" setup>
import { useGlobalStore, type TabPane } from '@/store/useGlobalStore'
import { Snapshot, useWorkspeaceSnapshot } from '@/store/useWorkspeaceSnapshot'
import { uniqueId } from 'lodash-es'
import { computed, ref } from 'vue'
import { ok } from 'vue3-ts-util'
import { uiMessage } from '@/ui'
import MsIcon from '@/ui/MsIcon.vue'
import { t } from '@/i18n'
import { cloneDeep } from 'lodash-es'
import { useImgSliStore } from '@/store/useImgSli'
import { addToExtraPath, onAliasExtraPathClick, onRemoveExtraPathClick } from './extraPathControlFunc'
import actionContextMenu from './actionContextMenu.vue'
import { ExtraPathType } from '@/api/db'
import { onMounted } from 'vue'
import { hasNewRelease, version, latestCommit } from '@/util/versionManager'
import { isTauri } from '@/util/env'
import { useSettingSync } from '@/util'

const global = useGlobalStore()
const imgsli = useImgSliStore()
const workspaceSnapshot = useWorkspeaceSnapshot()
const props = defineProps<{
  tabIdx: number; paneIdx: number, popAddPathModal?: {
    path: string
    type: ExtraPathType
  }
}>()

onMounted(() => {
  if (props.popAddPathModal) {
    addToExtraPath(props.popAddPathModal.type, props.popAddPathModal.path)
  }
})

const sync = useSettingSync()

const helpModalOpen = ref(false)
const FAQ_URL = 'https://github.com/zanllp/sd-webui-infinite-image-browsing/issues/90'
const ISSUES_SEARCH_URL = 'https://github.com/zanllp/sd-webui-infinite-image-browsing/issues?q='
const NEW_ISSUE_URL = 'https://github.com/zanllp/sd-webui-infinite-image-browsing/issues/new'
const FEEDBACK_MAIL = 'mailto:qc@zanllp.cn'


const compCnMap: Partial<Record<TabPane['type'], string>> = {
  local: t('local'),
  'tag-search': t('imgSearch'),
  'fuzzy-search': t('fuzzy-search'),
  'topic-search': t('topicSearchExperimental'),
  'batch-download': t('batchDownload') + ' / ' + t('archive'),
  'workspace-snapshot': t('WorkspaceSnapshot'),
  'random-image': t('randomImage'),
  'global-setting': t('globalSettings'),
}
type FileTransModeIn = 'preset' | ExtraPathType
const createPane = (type: TabPane['type'], path?: string, mode?: FileTransModeIn) => {
  let pane: TabPane
  switch (type) {
    case 'grid-view':
    case 'tag-search-matched-image-grid':
    case 'topic-search-matched-image-grid':
    case 'img-sli':
      return
    case 'global-setting':
    case 'tag-search':
    case 'batch-download':
    case 'workspace-snapshot':
    case 'fuzzy-search':
    case 'topic-search':
    case 'random-image':
    case 'empty':
      pane = { type, name: compCnMap[type]!, key: Date.now() + uniqueId() }
      break
    case 'local':
      pane = {
        type,
        name: compCnMap[type]!,
        key: Date.now() + uniqueId(),
        path,
        mode: mode === 'scanned-fixed' || mode === 'walk' ? mode : 'scanned'
      }
  }
  return pane
}
const openInCurrentTab = (type: TabPane['type'], path?: string, mode?: FileTransModeIn) => {
  const pane = createPane(type, path, mode)
  if (!pane) return
  const tab = global.tabList[props.tabIdx]
  tab.panes.splice(props.paneIdx, 1, pane)
  tab.key = pane.key
}

const openInNewTab = (type: TabPane['type'], path?: string, mode?: FileTransModeIn) => {
  const pane = createPane(type, path, mode)
  if (!pane) return
  const tab = global.tabList[props.tabIdx]
  tab.panes.push(pane)
}

const openOnTheRight = (type: TabPane['type'], path?: string, mode?: FileTransModeIn) => {
  const pane = createPane(type, path, mode)
  if (!pane) return
  let tab = global.tabList[props.tabIdx + 1]
  if (!tab) {
    tab = { panes: [], key: '', id: uniqueId() }
    global.tabList[props.tabIdx + 1] = tab
  }
  tab.panes.push(pane)
  tab.key = pane.key
}

const lastRecord = computed(() => global.tabListHistoryRecord?.[1])


const walkModeSupportedDir = computed(() =>
  global.quickMovePaths.filter(
    ({ key: k, types }) =>
      k === 'outdir_txt2img_samples' ||
      k === 'outdir_img2img_samples' ||
      k === 'outdir_txt2img_grids' ||
      k === 'outdir_img2img_grids' ||
      types.includes('walk')
  )
)
const canpreviewInNewWindow = window.parent !== window
const previewInNewWindow = () => window.parent.open('/infinite_image_browsing' + (window.parent.location.href.includes('theme=dark') ? '?__theme=dark' : ''))

const restoreRecord = () => {
  ok(lastRecord.value)
  global.tabList = cloneDeep(lastRecord.value.tabs)
}

const restoreWorkspaceSnapshot = (item: Snapshot) => {
  global.tabList = cloneDeep(item.tabs)
}

const machine = computed(() => {
  if (isTauri) return 'desktop application'
  if ( global.conf?.launch_mode === 'sd') return 'sd-webui extension'
  return 'standalone'
})

const modePrefix = (mode?: FileTransModeIn) => {
  if (!mode || mode === 'scanned') return ''
  if (mode === 'walk') return 'Walk: '
  return 'Fixed: '

}

const modes = computed(() => {
  const modes = [] as string[]
  if (global.conf?.enable_access_control) {
    modes.push('accessLimited')
  }
  if(global.conf?.is_readonly) {
    modes.push('readonly')
  }
  return modes.map(v => t(v)).join(' + ')
})

</script>
<template>
  <div class="md3-welcome">
    <!-- ====== TOP APP BAR ====== -->
    <header class="md3-topbar">
      <h1 class="text-h5 font-weight-bold mb-0">{{ $t('welcome') }}</h1>

      <v-chip
        :variant="global.magicSwitchTiktokView ? 'tonal' : 'outlined'"
        :color="global.magicSwitchTiktokView ? 'primary' : undefined"
        size="small"
        class="ml-3"
        @click="global.magicSwitchTiktokView = !global.magicSwitchTiktokView"
      >
        <template #prepend>
          <span style="font-size:14px">{{ global.magicSwitchTiktokView ? '🎬' : '📁' }}</span>
        </template>
        {{ $t('tiktokView') }}
        <v-tooltip activator="parent" location="bottom" max-width="240">
          <div class="text-body-2 font-weight-bold mb-1">{{ $t('magicSwitchTiktokView') }}</div>
          <div class="text-caption">{{ $t('magicSwitchDetailDesc') }}</div>
        </v-tooltip>
      </v-chip>

      <v-spacer />

      <v-btn
        variant="text"
        size="small"
        href="https://github.com/zanllp/sd-webui-infinite-image-browsing"
        target="_blank"
        icon="mdi-github"
      />
      <v-btn variant="text" size="small" icon="mdi-help-circle-outline" @click="helpModalOpen = true" />

      <v-divider vertical class="mx-2" inset />

      <span v-if="!isTauri" class="text-caption mr-1">{{ $t('sync') }}</span>
      <v-switch v-if="!isTauri" v-model="sync" density="compact" hide-details inset />

      <v-btn-toggle v-model="global.darkModeControl" density="compact" mandatory divided class="ml-2">
        <v-btn size="x-small" value="light">Light</v-btn>
        <v-btn size="x-small" value="auto">Auto</v-btn>
        <v-btn size="x-small" value="dark">Dark</v-btn>
      </v-btn-toggle>
    </header>

    <!-- ====== HELP DIALOG ====== -->
    <v-dialog v-model="helpModalOpen" max-width="520">
      <v-card rounded="xl">
        <v-toolbar color="surface" density="compact" flat>
          <v-toolbar-title class="text-h6">{{ $t('helpFeedback') }}</v-toolbar-title>
          <v-btn variant="text" icon="mdi-close" @click="helpModalOpen = false" />
        </v-toolbar>
        <v-list density="compact" lines="two">
          <v-list-item prepend-icon="mdi-help-circle-outline">
            <v-list-item-title>{{ $t('helpFeedbackWay1') }}</v-list-item-title>
            <v-list-item-subtitle>
              <a :href="FAQ_URL" target="_blank">{{ $t('faq') }}</a>
              &nbsp;·&nbsp;
              <a :href="ISSUES_SEARCH_URL" target="_blank">{{ $t('helpFeedbackSearchIssues') }}</a>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-code-tags">
            <v-list-item-title>{{ $t('helpFeedbackWay2') }}</v-list-item-title>
            <v-list-item-subtitle>
              <a :href="NEW_ISSUE_URL" target="_blank">{{ $t('helpFeedbackNewIssue') }}</a>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-email-outline">
            <v-list-item-title>{{ $t('helpFeedbackWay3') }}</v-list-item-title>
            <v-list-item-subtitle>
              <a :href="FEEDBACK_MAIL">qc@zanllp.cn</a>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>

    <!-- ====== ACCESS CONTROL ====== -->
    <v-alert v-if="global.conf?.enable_access_control && !global.dontShowAgain" type="info" variant="tonal" density="compact" class="ma-4">
      <div class="d-flex align-center">
        <span class="text-caption">{{ $t('accessControlModeTips') }}</span>
        <v-spacer />
        <v-btn variant="text" size="x-small" @click="global.dontShowAgain = true">{{ $t('dontShowAgain') }}</v-btn>
      </div>
    </v-alert>

    <!-- ====== MAIN CONTENT ====== -->
    <div class="md3-body">

      <!-- SECTION: Walk Mode -->
      <v-card variant="flat" rounded="xl" class="md3-card">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
          <v-icon icon="mdi-directions-walk" color="primary" size="20" />
          {{ $t('walkMode') }}
        </v-card-title>
        <v-list density="compact" class="py-0">
          <v-list-item prepend-icon="mdi-plus" @click="addToExtraPath('walk')" :ripple="true">
            <v-list-item-title>{{ $t('add') }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="global.showRandomImageInStartup" class="px-4 pb-2">
            <v-btn @click.stop="openInCurrentTab('random-image')" color="primary" variant="tonal" rounded="pill" block>
              <span class="mr-2">🎲</span>{{ $t('tryMyLuck') }}
            </v-btn>
          </v-list-item>

          <actionContextMenu v-for="dir in walkModeSupportedDir" :key="dir.key"
            @open-in-new-tab="openInNewTab('local', dir.dir, 'walk')"
            @open-on-the-right="openOnTheRight('local', dir.dir, 'walk')">
            <v-list-item class="md3-removable" @click="openInCurrentTab('local', dir.dir, 'walk')" :ripple="true">
              <template #prepend>
                <v-avatar size="32" rounded="lg" color="surface-variant">
                  <v-icon size="18" icon="mdi-folder-outline" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ dir.zh }}</v-list-item-title>
              <template #append>
                <span v-if="dir.can_delete" class="md3-removable-actions">
                  <v-btn variant="text" size="x-small" @click.stop="onAliasExtraPathClick(dir.dir)">{{ $t('alias') }}</v-btn>
                  <v-btn variant="text" size="x-small" @click.stop="onRemoveExtraPathClick(dir.dir, 'walk')">{{ $t('remove') }}</v-btn>
                </span>
                <v-icon v-else size="18" icon="mdi-chevron-right" />
              </template>
            </v-list-item>
          </actionContextMenu>
        </v-list>
      </v-card>

      <!-- SECTION: Normal & Fixed -->
      <v-card v-if="global.quickMovePaths.length" variant="flat" rounded="xl" class="md3-card">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
          <v-icon icon="mdi-folder-multiple-outline" color="primary" size="20" />
          {{ $t('launchFromNormalAndFixed') }}
        </v-card-title>
        <v-list density="compact" class="py-0">
          <v-list-item prepend-icon="mdi-plus" @click="addToExtraPath('scanned-fixed')" :ripple="true">
            <v-list-item-title>{{ $t('add') }}</v-list-item-title>
          </v-list-item>
          <template
            v-for="dir in global.quickMovePaths.filter(({ types: ts }) => ts.includes('cli_access_only') || ts.includes('preset') || ts.includes('scanned') || ts.includes('scanned-fixed')) "
            :key="dir.key">
            <actionContextMenu v-for="t in dir.types.filter(v => v !== 'walk')" :key="t"
              @open-in-new-tab="openInNewTab('local', dir.dir, t)"
              @open-on-the-right="openOnTheRight('local', dir.dir, t)">
              <v-list-item class="md3-removable" @click="openInCurrentTab('local', dir.dir, t)" :ripple="true">
                <template #prepend>
                  <v-avatar size="32" rounded="lg" color="surface-variant">
                    <v-icon size="18" icon="mdi-folder-outline" />
                  </v-avatar>
                </template>
                <v-list-item-title class="d-flex align-center">
                  <v-chip v-if="t == 'scanned-fixed'" size="x-small" color="primary" variant="flat" class="mr-2">Fixed</v-chip>
                  {{ dir.zh }}
                </v-list-item-title>
                <template #append>
                  <span v-if="dir.can_delete && (t === 'scanned-fixed' || t === 'scanned')" class="md3-removable-actions">
                    <v-btn variant="text" size="x-small" @click.stop="onAliasExtraPathClick(dir.dir)">{{ $t('alias') }}</v-btn>
                    <v-btn variant="text" size="x-small" @click.stop="onRemoveExtraPathClick(dir.dir, t)">{{ $t('remove') }}</v-btn>
                  </span>
                  <v-icon v-else size="18" icon="mdi-chevron-right" />
                </template>
              </v-list-item>
            </actionContextMenu>
          </template>
        </v-list>
      </v-card>

      <!-- SECTION: Launch -->
      <v-card variant="flat" rounded="xl" class="md3-card">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
          <v-icon icon="mdi-rocket-launch-outline" color="primary" size="20" />
          {{ $t('launch') }}
        </v-card-title>
        <v-list density="compact" class="py-0">
          <v-list-item v-for="comp in Object.keys(compCnMap) as TabPane['type'][]" :key="comp"
            @click="openInCurrentTab(comp)" :ripple="true" append-icon="mdi-chevron-right">
            <template #prepend>
              <v-avatar size="40" rounded="lg" color="primary" variant="tonal">
                <v-icon size="22" icon="mdi-open-in-new" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ compCnMap[comp] }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="imgsli.opened = true" :ripple="true" append-icon="mdi-chevron-right">
            <template #prepend>
              <v-avatar size="40" rounded="lg" color="primary" variant="tonal">
                <v-icon size="22" icon="mdi-compare" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ $t('imgCompare') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="canpreviewInNewWindow" @click="previewInNewWindow" :ripple="true" append-icon="mdi-open-in-new">
            <template #prepend>
              <v-avatar size="40" rounded="lg" color="surface-variant">
                <v-icon size="22" icon="mdi-fit-to-screen-outline" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ $t('openThisAppInNewWindow') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="lastRecord?.tabs.length" @click="restoreRecord" :ripple="true">
            <template #prepend>
              <v-avatar size="40" rounded="lg" color="surface-variant">
                <v-icon size="22" icon="mdi-history" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ $t('restoreLastWorkspaceState') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-for="item in workspaceSnapshot.snapshots" :key="item.id" @click="restoreWorkspaceSnapshot(item)" :ripple="true">
            <template #prepend>
              <v-avatar size="40" rounded="lg" color="surface-variant">
                <v-icon size="22" icon="mdi-bookmark-outline" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ $t('restoreWorkspaceSnapshot', [item.name]) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- SECTION: Recent -->
      <v-card v-if="global.recent.length" variant="flat" rounded="xl" class="md3-card">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
          <v-icon icon="mdi-clock-outline" color="primary" size="20" />
          {{ $t('recent') }}
          <v-spacer />
          <v-btn @click="global.recent = []" variant="text" size="x-small" color="error">Clear</v-btn>
        </v-card-title>
        <v-list density="compact" class="py-0">
          <v-list-item v-for="item in global.recent" :key="item.key"
            @click="openInCurrentTab('local', item.path, item.mode)" :ripple="true" append-icon="mdi-chevron-right">
            <template #prepend>
              <v-icon size="20" icon="mdi-history" />
            </template>
            <v-list-item-title>{{ modePrefix(item.mode) }}{{ global.getShortPath(item.path) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <!-- ====== FOOTER ====== -->
    <footer class="md3-footer" @dblclick="uiMessage.info('Ciallo～(∠・ω< )⌒☆')">
      <v-chip v-if="modes" size="x-small" variant="outlined">{{ modes }}</v-chip>
      <span class="text-caption text-medium-emphasis">{{ version.tag }} · {{ machine }}</span>
      <span v-if="version.hash" class="text-caption text-medium-emphasis">{{ version.hash.slice(0, 7) }}</span>
      <span v-if="latestCommit && version.hash && latestCommit.sha !== version.hash" class="text-caption text-warning">(ahead)</span>
      <v-btn variant="text" size="x-small" href="https://github.com/zanllp/sd-webui-infinite-image-browsing/releases" target="_blank">Releases</v-btn>
      <v-btn variant="text" size="x-small" href="https://github.com/zanllp/sd-webui-infinite-image-browsing/wiki/Change-log" target="_blank">{{ $t('changlog') }}</v-btn>
      <v-btn variant="text" size="x-small" href="https://github.com/zanllp/sd-webui-infinite-image-browsing/blob/main/.env.example" target="_blank">{{ $t('privacyAndSecurity') }}</v-btn>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.md3-welcome {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
}

// ----- Top Bar -----
.md3-topbar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 12px 20px;
  gap: 4px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

// ----- Body -----
.md3-body {
  flex: 1 1 0;
  overflow: auto;
  padding: 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

// ----- Card -----
.md3-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));

  :deep(.v-card-title) {
    padding: 16px 16px 8px;
  }

  :deep(.v-list) {
    background: transparent;
  }

  :deep(.v-list-item--density-compact) {
    min-height: 48px;
  }
}

// ----- Removable items -----
.md3-removable {
  .md3-removable-actions {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .md3-removable-actions {
    opacity: 1;
  }
}

// ----- Footer -----
.md3-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px;
  flex-shrink: 0;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

.text-medium-emphasis {
  opacity: 0.6;
}
</style>
