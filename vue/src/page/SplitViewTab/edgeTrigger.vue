<script setup lang="ts">
import { useMouseInElement } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { safeJsonParse } from '@/util'

const global = useGlobalStore()
const props = defineProps<{ tabIdx: number }>()
const trigger = ref<HTMLDivElement>()
const edgeTrigger = ref<HTMLDivElement>()
const { isOutside: edgeTriggerOutside } = useMouseInElement(edgeTrigger)
const { isOutside: triggerOutside } = useMouseInElement(trigger)
const edgeAccpet = computed(() => !edgeTriggerOutside.value && !!global.dragingTab)
const accept = computed(() => !triggerOutside.value && !!global.dragingTab && !edgeAccpet.value)
const onDrop = (payload: DragEvent, type: 'add-right' | 'insert') => {
  const from = safeJsonParse<{
    from: 'tab-drag'
    tabIdx: number
    paneIdx: number
  }>(payload.dataTransfer?.getData('text') ?? '{}')
  if (!from) {
    return 
  }
  console.log('on-drop', type, from)
  if (from?.from === 'tab-drag') {
    payload.stopPropagation()
    global.dragingTab = undefined
    if (type === 'insert' && from.tabIdx === props.tabIdx) {
      return
    }
    global.movePane(from.tabIdx, from.paneIdx, props.tabIdx, type)
  }
}
</script>

<template>
  <div
    class="wrap"
    ref="trigger"
    :class="{ accept }"
    @dragover.prevent
    @drop.prevent="onDrop($event, 'insert')"
  >
    <div
      class="iib-tab-edge-trigger"
      ref="edgeTrigger"
      :class="{ accept: edgeAccpet }"
      @dragover.prevent
      @drop.prevent="onDrop($event, 'add-right')"
    ></div>
    <div style="position: relative">
      <slot />
    </div>
  </div>
</template>
<style scoped lang="scss">
.wrap {
  position: relative;
  height: 100%;
  background: #188fff00;
  transition: all 0.3s ease;

  .iib-tab-edge-trigger {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 10%;
    transition: all 0.3s ease;
    background: #188fff00;
  }

  .accept,
  &.accept {
    background: #188fff31;
    z-index: 9999;
  }
}
</style>
