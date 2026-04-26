import { defineStore } from 'pinia'

export interface UiConfirmOptions {
  title?: string
  message: string
  okText?: string
  cancelText?: string
  danger?: boolean
  maskClosable?: boolean
}

export interface UiPromptOptions {
  title?: string
  message: string
  okText?: string
  cancelText?: string
  danger?: boolean
  maskClosable?: boolean
  password?: boolean
  initialValue?: string
}

type Resolver<T> = (v: T) => void

export const useDialogStore = defineStore('ui_dialog', {
  state: () => ({
    confirm: null as (UiConfirmOptions & { resolve: Resolver<boolean> }) | null,
    prompt: null as (UiPromptOptions & { value: string; resolve: Resolver<string> }) | null,
  }),
  actions: {
    openConfirm(opts: UiConfirmOptions): Promise<boolean> {
      return new Promise<boolean>((resolve) => {
        this.confirm = { ...opts, resolve }
      })
    },
    openPrompt(opts: UiPromptOptions): Promise<string> {
      return new Promise<string>((resolve) => {
        this.prompt = { ...opts, value: opts.initialValue ?? '', resolve }
      })
    },
    resolveConfirm(v: boolean) {
      const c = this.confirm
      this.confirm = null
      c?.resolve(v)
    },
    resolvePrompt(v: string) {
      const p = this.prompt
      this.prompt = null
      p?.resolve(v)
    },
  },
})
