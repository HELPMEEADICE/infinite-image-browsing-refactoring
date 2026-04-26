<script lang="ts" setup>
import { ref } from 'vue'

const emit = defineEmits(['openOnTheRight', 'openInNewTab'])
const open = ref(false)
const x = ref(0)
const y = ref(0)

const onContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  x.value = e.clientX
  y.value = e.clientY
  open.value = true
}

const onMenuClick = (key: 'openOnTheRight' | 'openInNewTab') => {
  open.value = false
  emit(key)
}
</script>
<template>
  <div @contextmenu="onContextMenu">
    <slot />
    <v-menu
      v-model="open"
      :scrim="false"
      :close-on-content-click="true"
      location-strategy="connected"
      :target="[x, y]"
    >
      <v-list density="compact" min-width="180">
        <v-list-item @click="onMenuClick('openOnTheRight')">
          <v-list-item-title>{{ $t('openOnTheRight') }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="onMenuClick('openInNewTab')">
          <v-list-item-title>{{ $t('openInNewTab') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped lang="scss"></style>
