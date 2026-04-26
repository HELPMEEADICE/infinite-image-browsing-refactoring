<script setup lang="ts">
import { useGlobalStore } from '@/store/useGlobalStore'
defineProps<{
  show: boolean
}>()
const emit = defineEmits<{
  selectAll: [],
  reverseSelect: [],
  clearAllSelected: []
}>()
const g = useGlobalStore()

const onExit = () => {
  emit('clearAllSelected')
  g.keepMultiSelect = false
}

const onKeepClick = () => {
  g.keepMultiSelect = true
}


</script>
<template>
  <div class="float-panel" v-if="show">
    <div v-if="g.keepMultiSelect" class="select-actions">
      <v-btn size="small" @click="emit('selectAll')">{{ $t('select-all') }}</v-btn>
      <v-btn size="small" @click="emit('reverseSelect')">{{ $t('rerverse-select') }}</v-btn>
      <v-btn size="small" @click="emit('clearAllSelected')">{{ $t('clear-all-selected') }}</v-btn>
      <v-btn size="small" @click="onExit">{{ $t('exit') }}</v-btn>
    </div>
    <div v-else>
      <v-btn size="small" color="primary" @click="onKeepClick">{{ $t('keep-multi-selected') }}</v-btn>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.select-actions > :not(:last-child)  {
  margin-right: 4px;
}
.float-panel {
  position: absolute;
  bottom: 32px;
  right: 32px;
  background: var(--zp-primary-background);
  border-radius: 4px;
  z-index: 1000;
  padding: 8px;
  box-shadow: 0px 0px 4px var(--zp-secondary);
}
</style>