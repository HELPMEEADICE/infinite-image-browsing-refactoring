<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { deepComputedEffect } from 'vue3-ts-util'
import { t } from '@/i18n'
import { uiMessage } from '@/ui'

interface KVPair {
  key: string
  value: any
}
interface KVPairLocal {
  key: string
  value: string
}

interface Props {
  modelValue: KVPair
  allKeys?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: KVPair): void
  (e: 'remove'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Key 错误状态
const keyError = ref('')

// 校验 key 是否有效
const validateKey = (key: string): boolean => {
  if (!key.trim()) {
    keyError.value = t('keyRequired')
    return false
  }

  if (props.allKeys && props.allKeys.includes(key.trim())) {
    keyError.value = t('keyMustBeUnique')
    return false
  }

  keyError.value = ''
  return true
}

const modeInitial= () => {
  const value = localKv.value.value
  if (!value) return 'str' // 空值默认为字符串模式

  try {
    const parsed = JSON.parse(value)
    // 如果解析成功且不是字符串类型，则认为是 JSON 模式
    return typeof parsed !== 'string' ? 'json' : 'str'
  } catch {
    // 解析失败，是字符串模式
    return 'str'
  }
}
// 组件内部状态：判断当前值是否为 JSON 模式
const mode = ref('str' as 'str' | 'json')

// 本地状态，用于双向绑定
const localKv = deepComputedEffect<KVPairLocal>({
  get () {
    const val = props.modelValue.value
    const isString = typeof val === 'string' && mode.value !== 'json'
    return {
      ...props.modelValue,
      value: isString
        ? val
        : JSON.stringify(props.modelValue.value, null, 2)
    }
  },
  set (newValue: KVPairLocal) {
    // 校验 key，如果无效则不 emit
    if (!validateKey(newValue.key)) {
      return
    }

    const value = newValue.value
    const allVal = {
      ...newValue,
      value: mode.value === 'json' ? JSON.parse(value) : value
    }
    emit('update:modelValue', allVal)
  }
})

mode.value = modeInitial()




// 判断当前值是否为有效 JSON
const isValidJson = ref(true)

// JSON 输入的 computed
const jsonInput = ref('{}')

watch([() => localKv.value.value, () => mode.value], () => {
  if (mode.value === 'json') {
    try {
      const parsed = JSON.parse(localKv.value.value)
      jsonInput.value = JSON.stringify(parsed, null, 2)
    } catch (e) {
      console.warn('Invalid JSON, resetting jsonInput to empty object', localKv.value.value)
      jsonInput.value = '{}'
    }
  }
},{  immediate: true })



const onJsonUpdate = () => {
  const newValue = jsonInput.value
  if (checkIsValidJson(newValue)) {
    localKv.value.value = newValue
    isValidJson.value = true
  } else {
    isValidJson.value = false
  }
}

// 字符串输入的 computed
const stringInput = computed({
  get () {
    return localKv.value.value
  },
  set (newValue: string) {

    localKv.value.value = newValue
  }
})

const checkIsValidJson = (str: string) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}




// 处理模式切换
const handleModeChange = (newMode: 'str' | 'json') => {
  const currentValue = localKv.value.value

  // 如果当前值为空，允许切换
  if (!currentValue) {
    mode.value = newMode
    return
  }

  // 检查是否允许切换
  if (newMode === 'json' && currentValue) {
    uiMessage.warning(t('clearBeforeSwitchToJson'))
    return
  }

  if (newMode === 'str' && jsonInput.value.trim()) {
    uiMessage.warning(t('clearBeforeSwitchToString'))
    console.warn('Switching to string mode requires empty value', {
      val: jsonInput.value
    })
    return
  }

  localKv.value.value = '' // 切换模式前清空当前值


  mode.value = newMode
}

// 处理删除
const handleRemove = () => {
  emit('remove')
}

// 暴露校验方法给父组件
const validate = (): boolean => {
  const keyValid = validateKey(localKv.value.key)
  const jsonValid = mode.value === 'json' ? isValidJson.value : true
  return keyValid && jsonValid
}

// 暴露方法和状态给父组件
defineExpose({
  validate,
  keyError,
  isValidJson
})
</script>

<template>
  <div class="kv-pair-editor">
    <div class="kv-key-wrapper">
      <v-text-field v-model="localKv.key" :placeholder="t('keyPlaceholder')" class="kv-input kv-key" hide-details density="compact" />
      <div v-if="keyError" class="key-error-hint">{{ keyError }}</div>
    </div>

    <div v-if="mode === 'json'" class="kv-value-wrapper">
      <v-textarea v-model="jsonInput" @blur="onJsonUpdate" :placeholder="t('jsonValuePlaceholder')"
        :rows="4" auto-grow class="kv-input kv-value" hide-details density="compact" />
      <div v-if="!isValidJson" class="json-error-hint">{{ t('jsonFormatError') }}</div>
    </div>

    <v-textarea v-else :rows="4" auto-grow v-model="stringInput" :placeholder="t('stringValuePlaceholder')" class="kv-input kv-value" hide-details density="compact" />

    <v-select :model-value="mode" class="mode-selector"
      @update:model-value="handleModeChange"
      :items="[{ title: t('stringMode'), value: 'str' }, { title: t('jsonMode'), value: 'json' }]"
      style="width: 100px" hide-details density="compact" />

    <v-btn size="small" color="error" variant="text" @click="handleRemove" class="delete-btn">
      {{ t('delete') }}
    </v-btn>
  </div>
</template>

<style scoped lang="scss">
.kv-pair-editor {
  display: flex;
  gap: 8px;
  align-items: center;
}

.kv-input {
  font-size: 12px;
}

.kv-key-wrapper {
  min-width: 50px;
  max-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kv-key {
  width: 100%;
}

.kv-value {
  min-width: 200px;
}

.kv-value-wrapper {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.key-error-hint {
  font-size: 11px;
  color: #ff4d4f;
  line-height: 1.2;
}

.json-error-hint {
  font-size: 11px;
  color: #ff4d4f;
  line-height: 1.2;
}

.mode-selector {
  font-size: 12px;
  flex-shrink: 0;
}

.delete-btn {
  font-size: 12px;
  flex-shrink: 0;
}
</style>
