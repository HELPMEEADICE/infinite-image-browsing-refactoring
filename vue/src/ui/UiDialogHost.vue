<script setup lang="ts">
import { computed } from 'vue'
import { useDialogStore } from './dialogStore'

const d = useDialogStore()

const confirmOpen = computed(() => !!d.confirm)
const promptOpen = computed(() => !!d.prompt)

const confirmPersistent = computed(() => d.confirm?.maskClosable === false)
const promptPersistent = computed(() => d.prompt?.maskClosable === false)
</script>

<template>
  <!-- Confirm -->
  <v-dialog
    :model-value="confirmOpen"
    :persistent="confirmPersistent"
    max-width="560"
    @update:model-value="(v) => !v && d.resolveConfirm(false)"
  >
    <v-card v-if="d.confirm">
      <v-card-title>{{ d.confirm.title ?? 'Confirm' }}</v-card-title>
      <v-card-text style="white-space: pre-line">{{ d.confirm.message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="d.resolveConfirm(false)">{{ d.confirm.cancelText ?? 'Cancel' }}</v-btn>
        <v-btn :color="d.confirm.danger ? 'error' : 'primary'" @click="d.resolveConfirm(true)">{{ d.confirm.okText ?? 'OK' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Prompt -->
  <v-dialog
    :model-value="promptOpen"
    :persistent="promptPersistent"
    max-width="560"
    @update:model-value="(v) => !v && d.resolvePrompt('')"
  >
    <v-card v-if="d.prompt">
      <v-card-title>{{ d.prompt.title ?? 'Input' }}</v-card-title>
      <v-card-text>
        <div style="white-space: pre-line">{{ d.prompt.message }}</div>
        <v-text-field
          v-model="d.prompt.value"
          :type="d.prompt.password ? 'password' : 'text'"
          autocomplete="current-password"
          name="password"
          autocapitalize="off"
          :spellcheck="false"
          hide-details
          style="margin-top: 12px"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="d.resolvePrompt('')">{{ d.prompt.cancelText ?? 'Cancel' }}</v-btn>
        <v-btn :color="d.prompt.danger ? 'error' : 'primary'" @click="d.resolvePrompt(d.prompt.value)">{{ d.prompt.okText ?? 'OK' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
