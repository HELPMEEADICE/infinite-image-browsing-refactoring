<template>
  <v-dialog
    v-model="globalStore.showSmartOrganizeConfig"
    width="70vw"
  >
    <v-card>
      <v-card-title>{{ t('smartOrganizeConfig') }}</v-card-title>
      <v-card-text>
        <!-- Info panel -->
        <div class="info-panel">
          <div class="info-row">
            <span class="info-label">{{ t('organizeSourceFolder') }}:</span>
            <code class="info-path">{{ globalStore.smartOrganizeConfigPath }}</code>
          </div>
          <div class="info-tips">
            <span>{{ t('smartOrganizeNotice') }}</span>
            <span class="separator">|</span>
            <span>{{ t('topicSearchRequirementsOpenai') }}</span>
            <span class="separator">|</span>
            <span>{{ t('topicSearchRequirementsDepsPython') }}</span>
          </div>
        </div>

        <v-row>
          <v-col cols="4">
            <v-label>{{ t('organizeTargetFolder') }}</v-label>
          </v-col>
          <v-col cols="8">
            <v-text-field v-model="config.destFolder" :placeholder="globalStore.smartOrganizeConfigPath" :disabled="loading" hide-details density="compact" />
            <div class="form-item-hint">{{ t('organizeTargetFolderDesc') }}</div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-label>{{ t('organizeRecursive') }}</v-label>
          </v-col>
          <v-col cols="8">
            <v-switch v-model="config.recursive" :disabled="loading" hide-details />
            <div class="form-item-hint">{{ t('organizeRecursiveDesc') }}</div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-label>{{ t('organizeMinClusterSize') }}</v-label>
          </v-col>
          <v-col cols="8">
            <v-text-field v-model="config.minClusterSize" type="number" :min="2" :max="20" style="width: 100px" :disabled="loading" hide-details density="compact" />
            <div class="form-item-hint">{{ t('organizeMinClusterSizeDesc') }}</div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-label>{{ t('organizeAction') }}</v-label>
          </v-col>
          <v-col cols="8">
            <v-radio-group v-model="config.action" :disabled="loading" inline>
              <v-radio value="move" :label="t('organizeActionMove')"></v-radio>
              <v-radio value="copy" :label="t('organizeActionCopy')"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>

        <!-- Loading status -->
        <div v-if="loading" class="loading-status">
          <v-progress-circular indeterminate :size="16" :width="2"></v-progress-circular>
          <span style="margin-left: 8px">{{ loadingText }}</span>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn @click="handleCancel" :disabled="loading">{{ t('organizeCancel') }}</v-btn>
        <v-btn color="primary" @click="handleOk" :loading="loading">{{ t('organizeStartTask') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { t } from '@/i18n'
import { useGlobalStore } from '@/store/useGlobalStore'
import { startSmartOrganizeWithConfig, type SmartOrganizeConfig } from '@/util/smartOrganize'
import { buildIibOutputEmbeddings } from '@/api/db'

const globalStore = useGlobalStore()

const loading = ref(false)
const loadingText = ref('')

const config = reactive<SmartOrganizeConfig>({
  destFolder: '',
  recursive: false,
  minClusterSize: 3,
  action: 'move'
})

// Reset config when modal opens
watch(() => globalStore.showSmartOrganizeConfig, (val) => {
  if (val) {
    config.destFolder = ''
    config.recursive = false
    config.minClusterSize = 3
    config.action = 'move'
    loading.value = false
    loadingText.value = ''
  }
})

const handleOk = async () => {
  const folderPath = globalStore.smartOrganizeConfigPath

  try {
    loading.value = true

    // Step 1: Update index (use config.recursive to match organize scope)
    loadingText.value = t('updatingIndex')
    await buildIibOutputEmbeddings({ folder: folderPath, recursive: config.recursive })

    // Step 2: Start organize job
    loadingText.value = t('startingOrganizeJob')
    await startSmartOrganizeWithConfig([folderPath], {
      ...config,
      destFolder: config.destFolder || folderPath
    })

    globalStore.showSmartOrganizeConfig = false
  } catch (e: any) {
    console.error('Smart organize failed:', e)
  } finally {
    loading.value = false
    loadingText.value = ''
  }
}

const handleCancel = () => {
  if (!loading.value) {
    globalStore.showSmartOrganizeConfig = false
  }
}
</script>

<style scoped lang="scss">
.info-panel {
  margin-bottom: 16px;
  padding: 10px 12px;
  background: var(--zp-secondary-background);
  border-radius: 4px;
  font-size: 12px;

  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .info-label {
    color: var(--zp-secondary-text);
    flex-shrink: 0;
  }

  .info-path {
    background: var(--zp-primary-background);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    word-break: break-all;
  }

  .info-tips {
    color: var(--zp-tertiary-text);
    font-size: 11px;
    line-height: 1.5;

    .separator {
      margin: 0 6px;
      opacity: 0.5;
    }
  }
}

.form-item-hint {
  font-size: 12px;
  color: var(--zp-secondary-text);
  margin-top: 4px;
}

.loading-status {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--zp-secondary-background);
  border-radius: 4px;
  margin-top: 8px;
}
</style>
