import { useSnackbarStore } from './snackbarStore'
import { useDialogStore, type UiConfirmOptions, type UiPromptOptions } from './dialogStore'

export const uiMessage = {
  success(text: string, timeoutMs?: number) {
    useSnackbarStore().push('success', text, timeoutMs)
  },
  info(text: string, timeoutMs?: number) {
    useSnackbarStore().push('info', text, timeoutMs)
  },
  warning(text: string, timeoutMs?: number) {
    useSnackbarStore().push('warning', text, timeoutMs)
  },
  error(text: string, timeoutMs?: number) {
    useSnackbarStore().push('error', text, timeoutMs)
  },
}

export const uiDialog = {
  confirm(opts: UiConfirmOptions) {
    return useDialogStore().openConfirm(opts)
  },
  prompt(opts: UiPromptOptions) {
    return useDialogStore().openPrompt(opts)
  },
}
