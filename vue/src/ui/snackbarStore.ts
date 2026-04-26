import { defineStore } from 'pinia'

export type UiMessageType = 'success' | 'info' | 'warning' | 'error'

export interface UiMessageItem {
  id: number
  type: UiMessageType
  text: string
  timeoutMs: number
}

let nextId = 1

export const useSnackbarStore = defineStore('ui_snackbar', {
  state: () => ({
    queue: [] as UiMessageItem[],
    active: null as UiMessageItem | null,
  }),
  actions: {
    push(type: UiMessageType, text: string, timeoutMs = 3000) {
      this.queue.push({ id: nextId++, type, text, timeoutMs })
      this._drain()
    },
    dismissActive() {
      this.active = null
      this._drain()
    },
    _drain() {
      if (this.active) return
      const next = this.queue.shift() ?? null
      this.active = next
    },
  },
})
