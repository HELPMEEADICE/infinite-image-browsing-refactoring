<script setup lang="ts">
export interface TabContextMenuItem {
  key: string
  label: string
  icon?: string
  danger?: boolean
}

const props = defineProps<{
  modelValue: boolean
  x: number
  y: number
  items: TabContextMenuItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', key: string): void
}>()

const onSelect = (key: string) => {
  emit('select', key)
  emit('update:modelValue', false)
}
</script>

<template>
  <v-menu
    :model-value="props.modelValue"
    :close-on-content-click="false"
    :scrim="false"
    location-strategy="connected"
    :target="[props.x, props.y]"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <v-list density="compact" min-width="200">
      <v-list-item
        v-for="item in props.items"
        :key="item.key"
        :base-color="item.danger ? 'error' : undefined"
        @click="onSelect(item.key)"
      >
        <template v-if="item.icon" #prepend>
          <span class="material-symbols-outlined menu-icon">{{ item.icon }}</span>
        </template>
        <v-list-item-title>{{ item.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
.menu-icon {
  font-size: 18px;
}
</style>
