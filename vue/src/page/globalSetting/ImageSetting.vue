<script setup lang="ts">
import { t } from '@/i18n'
import { useGlobalStore } from '@/store/useGlobalStore'
import NumInput from '@/components/numInput.vue'
import sampleImg from './sample.webp'
import { ref } from 'vue'
import { watch } from 'vue'
import { debounce } from 'lodash-es'

function reduceImageResolution (imagePath: string, scaleFactor: number) {
  return new Promise<string>(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scaleFactor
      canvas.height = img.height * scaleFactor
      const ctx = canvas.getContext('2d')
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL())
    }
    img.src = imagePath
  })
}

const g = useGlobalStore()
const thuImg = ref('')
watch(() => [g.enableThumbnail, g.gridThumbnailResolution], debounce(async () => {
  if (g.enableThumbnail) {
    thuImg.value = await reduceImageResolution(sampleImg, g.gridThumbnailResolution / 1024)
  }
}, 300), { immediate: true, deep: true })


</script>
<template>
  <v-label class="d-flex align-center ga-4 mb-4">
    {{ t('defaultGridCellWidth') }}
    <NumInput :min="64" :max="1024" :step="16" v-model="g.defaultGridCellWidth" />
  </v-label>
  <v-label class="d-flex align-center ga-4 mb-4">
    {{ t('useThumbnailPreview') }}
    <v-switch v-model="g.enableThumbnail" hide-details />
  </v-label>
  <v-label class="d-flex align-center ga-4 mb-4" v-if="g.enableThumbnail">
    {{ t('thumbnailResolution') }}
    <NumInput v-model="g.gridThumbnailResolution" :min="256" :max="1024" :step="64" />
  </v-label>
  <v-label class="d-flex align-center ga-4 mb-4">
    {{ t('livePreview') }}
    <div>
      <img :width="g.defaultGridCellWidth" :height="g.defaultGridCellWidth" :src="g.enableThumbnail ? thuImg : sampleImg">
    </div>
  </v-label>
  <v-label class="d-flex align-center ga-4 mb-4">
    {{ t('defaultShowChangeIndicators') }}
    <v-switch v-model="g.defaultChangeIndchecked" hide-details />
  </v-label>
  <v-label class="d-flex align-center ga-4 mb-4" v-if="g.defaultChangeIndchecked">
    {{ t('defaultSeedAsChange') }}
    <v-switch v-model="g.defaultSeedChangeChecked" hide-details />
  </v-label>
  <v-label class="d-flex align-center ga-4 mb-4">
    {{ t('previewMaskBackgroundOpacity') }}
    <NumInput :min="0" :max="1" :step="0.05" v-model="g.previewBgOpacity" />
  </v-label>
</template>
<style lang="scss" scoped></style>
