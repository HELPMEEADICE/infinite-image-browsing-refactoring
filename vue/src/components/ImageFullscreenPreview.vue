<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { CloseCircleOutlined } from '@/icon'

const props = defineProps<{
  modelValue: boolean
  src: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'visibleChange': [value: boolean, last: boolean]
}>()

const setVisible = (value: boolean) => {
  if (value === props.modelValue) return
  emit('update:modelValue', value)
}

const close = () => setVisible(false)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

watch(() => props.modelValue, (value, last) => {
  if (value) {
    document.addEventListener('keydown', onKeydown)
    document.body.classList.add('iib-image-preview-open')
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.classList.remove('iib-image-preview-open')
  }
  if (value !== last) {
    emit('visibleChange', value, last)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('iib-image-preview-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="md3-image-preview">
      <div v-if="modelValue" class="image-preview-root">
        <div class="image-preview-overlay" @click="close">
          <div class="image-preview-surface" @click.stop>
            <button class="image-preview-close" type="button" aria-label="Close preview" @click="close">
              <CloseCircleOutlined />
            </button>
            <img
              class="preview-img image-preview-img"
              :src="src"
              @dblclick="close"
              @dragstart.prevent
            >
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.image-preview-root {
  position: fixed;
  inset: 0;
  z-index: 11110;
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: var(--iib-preview-mask-bg, rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(4px);
  cursor: zoom-out;
}

.image-preview-surface {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: min(96vw, calc(100vw - 48px));
  max-height: min(96vh, calc(100vh - 48px));
  padding: 12px;
  border-radius: 28px;
  background: color-mix(in srgb, var(--zp-primary-background) 18%, transparent);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.32), 0 8px 16px rgba(0, 0, 0, 0.24);
  cursor: default;
}

.image-preview-img {
  display: block;
  max-width: calc(96vw - 24px);
  max-height: calc(96vh - 24px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 20px;
  user-select: none;
}

.image-preview-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  color: white;
  background: rgba(0, 0, 0, 0.54);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.72);
    transform: scale(1.04);
  }

  :deep(.material-symbols-outlined) {
    font-size: 28px;
  }
}

.md3-image-preview-enter-active,
.md3-image-preview-leave-active {
  transition: opacity 0.2s ease;

  .image-preview-surface {
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease;
  }
}

.md3-image-preview-enter-from,
.md3-image-preview-leave-to {
  opacity: 0;

  .image-preview-surface {
    opacity: 0;
    transform: scale(0.96);
  }
}

@media (max-width: 600px) {
  .image-preview-overlay {
    padding: 8px;
  }

  .image-preview-surface {
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    padding: 4px;
    border-radius: 20px;
  }

  .image-preview-img {
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    border-radius: 16px;
  }
}
</style>
