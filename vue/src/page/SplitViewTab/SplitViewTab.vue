<script lang="ts" setup>
// @ts-ignore
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useGlobalStore, type TabPane } from '@/store/useGlobalStore'
import { defineAsyncComponent, watch } from 'vue'
import { globalEvents, asyncCheck, useGlobalEventListen } from '@/util'
import { debounce, uniqueId } from 'lodash-es'
import edgeTrigger from './edgeTrigger.vue'
import TabBar from './TabBar.vue'
import { t } from '@/i18n'
import { tryOnMounted, useDocumentVisibility, type Fn } from '@vueuse/core'
import ImgSliDrawer from '../ImgSli/ImgSliDrawer.vue'



const global = useGlobalStore()
const compMap: Record<TabPane['type'], ReturnType<typeof defineAsyncComponent>> = {
  local: defineAsyncComponent(() => import('@/page/fileTransfer/stackView.vue')),
  empty: defineAsyncComponent(() => import('./emptyStartup.vue')),
  'global-setting': defineAsyncComponent(() => import('@/page/globalSetting/globalSetting.vue')),
  'tag-search-matched-image-grid': defineAsyncComponent(
    () => import('@/page/TagSearch/MatchedImageGrid.vue')
  ),
  'topic-search-matched-image-grid': defineAsyncComponent(
    () => import('@/page/TopicSearch/MatchedImageGrid.vue')
  ),
  'tag-search': defineAsyncComponent(() => import('@/page/TagSearch/TagSearch.vue')),
  'fuzzy-search': defineAsyncComponent(() => import('@/page/TagSearch/SubstrSearch.vue')),
  'topic-search': defineAsyncComponent(() => import('@/page/TopicSearch/TopicSearch.vue')),
  'img-sli': defineAsyncComponent(() => import('@/page/ImgSli/ImgSliPagePane.vue')),
  'batch-download': defineAsyncComponent(() => import('@/page/batchDownload/batchDownload.vue')),
  'grid-view': defineAsyncComponent(() => import('@/page/gridView/gridView.vue')),
  'workspace-snapshot': defineAsyncComponent(() => import('@/page/WorkspeaceSnapshot/index.vue')),
  'random-image': defineAsyncComponent(() => import('@/page/randomImage/randomImage.vue')),
}
const onEdit = (idx: number, targetKey: any, action: string) => {
  const tab = global.tabList[idx]
  if (!tab) return
  if (action === 'add') {
    const empty: TabPane = { type: 'empty', key: uniqueId(), name: t('emptyStartPage') }
    tab.panes.push(empty)
    tab.key = empty.key
  } else {
    global.removePaneFromTab(idx, targetKey)
  }
}

const onDragStart = (tabIdx: number, paneIdx: number, e: DragEvent) => {
  global.dragingTab = { tabIdx, paneIdx }
  e.dataTransfer?.setData('text/plain', JSON.stringify({ tabIdx, paneIdx, from: 'tab-drag' }))
}

const onDragEnd = () => {
  global.dragingTab = undefined
}

const onTabContextAction = (tabIdx: number, action: string, pane: TabPane) => {
  switch (action) {
    case 'close':
      global.removePaneFromTab(tabIdx, pane.key)
      break
    case 'close-other':
      global.closeOtherPanes(tabIdx, pane.key)
      break
    case 'close-left':
      global.closePanesByDirection(tabIdx, pane.key, 'left')
      break
    case 'close-right':
      global.closePanesByDirection(tabIdx, pane.key, 'right')
      break
    case 'move-right-split':
      global.movePaneToRightSplit(tabIdx, pane.key)
      break
  }
}

useGlobalEventListen('closeTabPane', (tabIdx, key) => onEdit(tabIdx, key, 'del'))
watch(
  () => global.tabList,
  () => {
    global.saveRecord()
  },
  { immediate: true, deep: true }
)

const emitReturnToIIB = debounce(() => globalEvents.emit('returnToIIB'), 100)

tryOnMounted(async () => {
  const par = window.parent as Window & { get_uiCurrentTabContent (): undefined | HTMLButtonElement, onUiTabChange (cb: Fn): void }
  if (!await asyncCheck(() => par?.onUiTabChange, 200, 30_000)) {
    console.log('watch tab change failed')
    return
  }
  par.onUiTabChange(() => {
    const el = par.get_uiCurrentTabContent()
    if (el?.id.includes('infinite-image-browsing')) {
      emitReturnToIIB()
    }
  })
})
watch(useDocumentVisibility(), v => v && emitReturnToIIB())

</script>
<template>
  <div>
    <splitpanes class="default-theme">
      <pane v-for="(tab, tabIdx) in global.tabList" :key="tab.id">
        <edge-trigger :tabIdx="tabIdx">
          <div class="tab-shell">
            <TabBar
              :tab="tab"
              :tab-idx="tabIdx"
              @activate="tab.key = $event"
              @add="onEdit(tabIdx, '', 'add')"
              @close="onEdit(tabIdx, $event, 'del')"
              @drag-start="onDragStart(tabIdx, $event.paneIdx, $event.event)"
              @drag-end="onDragEnd"
              @context-action="onTabContextAction(tabIdx, $event.key, $event.pane)"
            />
            <div
              v-for="(pane, paneIdx) in tab.panes"
              v-show="tab.key === pane.key"
              :key="pane.key"
              class="pane"
            >
              <component :is="compMap[pane.type]" :tabIdx="tabIdx" :paneKey="pane.key" :paneIdx="paneIdx" v-bind="pane" />
            </div>
          </div>
        </edge-trigger>
      </pane>
    </splitpanes>
    <img-sli-drawer />
  </div>
</template>
<style scoped lang="scss">
:deep() .splitpanes {
  .splitpanes__splitter {
    background: var(--zp-primary-background);
  }

  .splitpanes__pane {
    background: var(--zp-primary-background);
    height: 100vh;
  }
}

.tab-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pane {
  height: calc(100vh - 42px);
  --pane-max-height: calc(100vh - 42px);
}
</style>
