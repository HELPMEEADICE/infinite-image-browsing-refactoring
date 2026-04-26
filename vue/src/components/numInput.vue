<script setup lang="ts">
const model = defineModel<number>()
const props = defineProps<{ min: number, max: number, step: number }>()

</script>
<template>
  <div class="num-input">
    <v-text-field v-model="model" type="number" v-bind="props" hide-details density="compact" />
    <v-slider v-model="model" v-bind="props" class="slide" hide-details />
  </div>
</template>
<style lang="scss" scoped>

.num-input {
  display: flex;
  .slide {
    flex: 1;
    min-width: 128px;
    max-width: 256px;
    margin-left: 8px;
  }
}
</style>