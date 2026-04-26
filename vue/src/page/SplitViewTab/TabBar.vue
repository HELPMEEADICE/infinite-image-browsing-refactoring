<script setup lang="ts">
import type { Tab, TabPane } from '@/store/useGlobalStore'
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import TabContextMenu, { type TabContextMenuItem } from './TabContextMenu.vue'

const props = defineProps<{
  tab: Tab
  tabIdx: number
}>()

const emit = defineEmits<{
  (e: 'activate', key: string): void
  (e: 'add'): void
  (e: 'close', key: string): void
  (e: 'drag-start', payload: { paneIdx: number; event: DragEvent }): void
  (e: 'drag-end'): void
  (e: 'context-action', payload: { key: string; pane: TabPane; paneIdx: number }): void
}>()

const menuOpen = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuPane = ref<TabPane | null>(null)
const menuPaneIdx = ref(-1)

const menuItems = computed<TabContextMenuItem[]>(() => [
  { key: 'close', label: t('close'), icon: 'close', danger: true },
  { key: 'close-other', label: t('closeOtherTabs') || 'Close other tabs', icon: 'tab_close_right' },
  { key: 'close-left', label: t('closeLeftTabs') || 'Close left tabs', icon: 'keyboard_double_arrow_left' },
  { key: 'close-right', label: t('closeRightTabs') || 'Close right tabs', icon: 'keyboard_double_arrow_right' },
  { key: 'move-right-split', label: t('openOnTheRight'), icon: 'right_panel_open' },
])

const openMenu = (event: MouseEvent, pane: TabPane, paneIdx: number) => {
  event.preventDefault()
  menuPane.value = pane
  menuPaneIdx.value = paneIdx
  menuX.value = event.clientX
  menuY.value = event.clientY
  menuOpen.value = true
}

const onMenuSelect = (key: string) => {
  if (!menuPane.value) return
  emit('context-action', { key, pane: menuPane.value, paneIdx: menuPaneIdx.value })
}
</script>

<template>
  <div class="tab-bar">
    <div class="tab-list">
      <div
        v-for="(pane, paneIdx) in props.tab.panes"
        :key="pane.key"
        class="iib-tab-item"
        :class="{ active: props.tab.key === pane.key }"
        draggable="true"
        @click="emit('activate', pane.key)"
        @contextmenu="openMenu($event, pane, paneIdx)"
        @dragstart="emit('drag-start', { paneIdx, event: $event })"
        @dragend="emit('drag-end')"
      >
        <button class="tab-drag-handle" type="button" @click.stop>
          <span class="material-symbols-outlined">drag_indicator</span>
        </button>
        <div class="tab-label">{{ typeof pane.name === 'string' ? pane.name : pane.nameFallbackStr || 'Tab' }}</div>
        <button class="tab-close" type="button" @click.stop="emit('close', pane.key)">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
    <button class="tab-add" type="button" @click="emit('add')">
      <span class="material-symbols-outlined">add</span>
    </button>
    <TabContextMenu
      v-model="menuOpen"
      :x="menuX"
      :y="menuY"
      :items="menuItems"
      @select="onMenuSelect"
    />
  </div>
</template>

<style scoped lang="scss">
.tab-bar {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 6px 8px 0;
  background: var(--zp-primary-background);
  border-bottom: 1px solid var(--zp-border);
}

.tab-list {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow-x: auto;
}

.iib-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 260px;
  padding: 0 8px;
  height: 34px;
  border-radius: 12px 12px 0 0;
  border: 1px solid transparent;
  color: var(--zp-secondary);
  background: var(--zp-secondary-background);
  cursor: pointer;
  user-select: none;

  &.active {
    color: var(--zp-primary);
    background: var(--zp-primary-background);
    border-color: var(--zp-border);
    border-bottom-color: var(--zp-primary-background);
  }
}

.tab-drag-handle,
.tab-close,
.tab-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
}

.tab-drag-handle .material-symbols-outlined,
.tab-close .material-symbols-outlined,
.tab-add .material-symbols-outlined {
  font-size: 18px;
}

.tab-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tab-add {
  align-self: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--zp-secondary-background);
}
</style>
