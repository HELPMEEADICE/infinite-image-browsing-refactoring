<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSnackbarStore } from './snackbarStore'

const s = useSnackbarStore()

const color = computed(() => {
  switch (s.active?.type) {
    case 'success':
      return 'success'
    case 'info':
      return 'info'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return undefined
  }
})

watch(
  () => s.active?.id,
  () => {
    // nothing: host reacts to active changes
  }
)
</script>

<template>
  <v-snackbar
    :model-value="!!s.active"
    :timeout="s.active?.timeoutMs ?? 3000"
    location="top"
    :color="color"
    @update:model-value="(v) => !v && s.dismissActive()"
    @timeout="s.dismissActive()"
  >
    {{ s.active?.text }}

    <template #actions>
      <v-btn variant="text" @click="s.dismissActive()">Close</v-btn>
    </template>
  </v-snackbar>
</template>
