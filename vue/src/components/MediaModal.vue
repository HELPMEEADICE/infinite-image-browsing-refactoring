<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMediaModalStore } from '@/store/useMediaModalStore'
import { useTagStore } from '@/store/useTagStore'
import { useGlobalStore } from '@/store/useGlobalStore'
import { getImageGenerationInfo } from '@/api'
import { parse } from '@/util/stable-diffusion-image-metadata'
import { downloadFiles, globalEvents, toRawFileUrl, toStreamVideoUrl, toStreamAudioUrl } from '@/util'
import { isStandalone } from '@/util/env'
import { setTargetFrameAsCover } from '@/api'
import { base64ToFile, video2base64 } from '@/util/video'
import { closeImageFullscreenPreview } from '@/util/imagePreviewOperation'
import { uiMessage } from '@/ui'
import { t } from '@/i18n'
import { openAddNewTagModal } from './functionalCallableComp'
import { DownloadOutlined, EditOutlined } from '@/icon'

const store = useMediaModalStore()
const tagStore = useTagStore()
const global = useGlobalStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const imageGenInfo = ref('')
const promptLoading = ref(false)

const loadPrompt = async () => {
  if (!store.file) return
  promptLoading.value = true
  try {
    const info = await getImageGenerationInfo(store.file.fullpath)
    imageGenInfo.value = info
  } catch (error) {
    console.error('Load prompt error:', error)
    imageGenInfo.value = ''
  } finally {
    promptLoading.value = false
  }
}

watch(() => store.visible, (v) => {
  if (v) {
    imageGenInfo.value = ''
    loadPrompt()
  }
})

const isSelected = (id: string | number) => {
  if (!store.file) return false
  return !!tagStore.tagMap.get(store.file.fullpath)?.some(v => v.id === id)
}

const geninfoStruct = () => parse(imageGenInfo.value)

const getTextLength = (text: string): number => {
  let length = 0
  for (const char of text) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      length += 3
    } else {
      length += 1
    }
  }
  return length
}

const isTagStylePrompt = (tags: string[]): boolean => {
  if (tags.length === 0) return false
  let totalLength = 0
  for (const tag of tags) {
    const tagLength = getTextLength(tag)
    totalLength += tagLength
    if (tagLength > 50) return false
  }
  const avgLength = totalLength / tags.length
  if (avgLength > 30) return false
  return true
}

const spanWrap = (text: string) => {
  if (!text) return ''
  const specBreakTag = 'BREAK'
  const values = text.replace(/&gt;\s/g, '> ,').replace(/\sBREAK\s/g, ',' + specBreakTag + ',')
    .split(/[\n,]+/)
    .map(v => v.trim())
    .filter(v => v)
  if (!isTagStylePrompt(values)) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `<p style="margin:0; padding:4px 0;">${line}</p>`)
      .join('')
  }
  const frags: string[] = []
  let parenthesisActive = false
  for (let i = 0; i < values.length; i++) {
    if (values[i] === specBreakTag) {
      frags.push('<br><span style="color:var(--zp-secondary); font-weight:bold;">BREAK</span><br>')
      continue
    }
    const trimmedValue = values[i]
    if (!parenthesisActive) parenthesisActive = trimmedValue.includes('(')
    const styles = ['background: var(--zp-secondary-variant-background)', 'color: var(--zp-primary)', 'padding: 2px 6px', 'border-radius: 4px', 'margin-right: 6px', 'margin-top: 4px', 'display: inline-block']
    if (parenthesisActive) styles.push('border: 1px solid var(--zp-secondary)')
    if (getTextLength(trimmedValue) < 32) styles.push('font-size: 0.9em')
    frags.push(`<span style="${styles.join('; ')}">${trimmedValue}</span>`)
    if (parenthesisActive) parenthesisActive = !trimmedValue.includes(')')
  }
  return frags.join(' ')
}

const handleTagClick = async (tagId: string | number) => {
  store.onTagClick?.(tagId)
}

const handleAddNewTag = async () => {
  await openAddNewTagModal()
  await loadPrompt()
}

const handleTiktokView = () => {
  store.onTiktokView?.()
  closeImageFullscreenPreview()
  store.close()
}

const handleSetFrameAsCover = async () => {
  if (!videoRef.value || !store.file) return
  const video = videoRef.value
  video.pause()
  const base64 = video2base64(video)
  await setTargetFrameAsCover({ path: store.file.fullpath, base64_img: base64, updated_time: store.file.date })
  store.file.cover_url = URL.createObjectURL(await base64ToFile(base64, 'cover'))
  uiMessage.success(t('success') + '!  ' + t('clearCacheIfNotTakeEffect'))
}

const handleEditPrompt = async () => {
  if (!store.file) return
  globalEvents.off('promptEditorUpdated')
  await new Promise<void>((resolve) => {
    const handler = () => {
      globalEvents.off('promptEditorUpdated', handler)
      resolve()
    }
    globalEvents.on('promptEditorUpdated', handler)
    globalEvents.emit('openPromptEditor', { file: store.file! })
  })
  await loadPrompt()
}

const metaEntries = computed(() => {
  const info = geninfoStruct()
  return Object.entries(info).filter(([key]) => key !== 'prompt' && key !== 'negativePrompt')
})
</script>

<template>
  <v-dialog
    :model-value="store.visible"
    @update:model-value="(v) => !v && store.close()"
    :width="store.mediaType === 'video' ? '80vw' : '70vw'"
    max-width="1200"
    scrollable
  >
    <v-card v-if="store.file">
      <v-card-title class="media-title">{{ store.file.name }}</v-card-title>
      <v-card-text>
        <div class="media-modal-body">
          <!-- Media Player -->
          <div class="media-player-section">
            <template v-if="store.mediaType === 'video'">
              <video
                ref="videoRef"
                :style="{
                  maxHeight: isStandalone ? '80vh' : '60vh',
                  maxWidth: '100%',
                  minWidth: '70%'
                }"
                :src="toStreamVideoUrl(store.file)"
                controls
                autoplay
              />
            </template>
            <template v-else>
              <div class="audio-icon">🎵</div>
              <audio
                :src="toStreamAudioUrl(store.file)"
                controls
                autoplay
                style="width: 100%; max-width: 500px;"
              />
            </template>
          </div>

          <!-- Tag Selection Area -->
          <div class="tag-section">
            <v-btn
              variant="outlined"
              color="primary"
              size="small"
              @click="handleAddNewTag"
            >
              {{ t('addNewCustomTag') }}
            </v-btn>
            <div class="tag-list">
              <span
                v-for="tag in global.conf?.all_custom_tags ?? []"
                :key="tag.id"
                class="tag-chip"
                :style="{
                  background: isSelected(tag.id) ? tagStore.getColor(tag) : 'var(--zp-primary-background)',
                  color: !isSelected(tag.id) ? tagStore.getColor(tag) : 'white',
                  border: `2px solid ${tagStore.getColor(tag)}`,
                }"
                @click="handleTagClick(tag.id)"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="actions-section">
            <v-btn
              size="small"
              variant="outlined"
              @click="downloadFiles([toRawFileUrl(store.file!, true)])"
              prepend-icon=""
            >
              <DownloadOutlined style="margin-right: 4px;" />
              {{ t('download') }}
            </v-btn>
            <v-btn
              v-if="store.onTiktokView"
              size="small"
              color="primary"
              @click="handleTiktokView"
            >
              {{ t('tiktokView') }}
            </v-btn>
            <v-btn
              v-if="store.mediaType === 'video'"
              size="small"
              variant="outlined"
              @click="handleSetFrameAsCover"
            >
              {{ t('setCurrFrameAsVideoPoster') }}
            </v-btn>
            <v-btn
              size="small"
              variant="outlined"
              @click="handleEditPrompt"
            >
              <EditOutlined style="margin-right: 4px;" />
              {{ t('editPrompt') }}
            </v-btn>
          </div>

          <!-- Prompt Display -->
          <div v-if="promptLoading" class="prompt-loading">
            <v-progress-circular indeterminate size="24" />
          </div>
          <div v-else-if="imageGenInfo" class="prompt-section">
            <div class="prompt-header">
              <span class="material-icons" style="font-size: 16px;">article</span>
              <span>Prompt</span>
            </div>
            <div v-if="geninfoStruct().prompt" class="prompt-block">
              <div class="prompt-label">Positive</div>
              <code class="prompt-content" v-html="spanWrap(geninfoStruct().prompt ?? '')" />
            </div>
            <div v-if="geninfoStruct().negativePrompt" class="prompt-block">
              <div class="prompt-label">Negative</div>
              <code class="prompt-content" v-html="spanWrap(geninfoStruct().negativePrompt ?? '')" />
            </div>
            <div v-if="metaEntries.length > 0" class="prompt-block">
              <div class="prompt-label">Meta</div>
              <code class="meta-content">
                {{ metaEntries.map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join('\n') }}
              </code>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="store.close()">{{ t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.media-title {
  word-break: break-all;
  padding-right: 48px;
}

.media-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.media-player-section {
  display: flex;
  justify-content: center;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.audio-icon {
  font-size: 80px;
  margin-bottom: 16px;
  text-align: center;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  margin: 2px;
  padding: 2px 16px;
  border-radius: 4px;
  display: inline-block;
  cursor: pointer;
  font-weight: bold;
  transition: 0.5s all ease;
  user-select: none;
  font-size: 13px;
  line-height: 1.8;
}

.actions-section {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
  width: 100%;
}

.prompt-loading {
  margin-top: 24px;
  width: 100%;
  text-align: center;
}

.prompt-section {
  margin-top: 24px;
  width: 100%;
  max-width: 1000px;
  align-self: flex-start;
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--zp-primary);
  font-size: 14px;
  font-weight: 500;
}

.prompt-block {
  margin-bottom: 12px;
}

.prompt-label {
  font-size: 12px;
  color: var(--zp-primary);
  margin-bottom: 6px;
}

.prompt-content {
  font-size: 13px;
  display: block;
  padding: 10px 12px;
  background: var(--zp-primary-background);
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6em;
}

.meta-content {
  font-size: 12px;
  display: block;
  padding: 8px 12px;
  background: var(--zp-secondary-background);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5em;
  color: var(--zp-primary);
  opacity: 0.7;
}
</style>
