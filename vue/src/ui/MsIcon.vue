<script setup lang="ts">
const props = defineProps<{
  name: string
  size?: number | string
}>()
</script>

<template>
  <!-- Use Material Icons ligature names. We keep this component name as MsIcon to align with the migration plan. -->
  <span
    class="material-symbols-outlined"
    :style="{
      fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
      lineHeight: 1,
      userSelect: 'none',
    }"
  >{{ props.name }}</span>
</template>
