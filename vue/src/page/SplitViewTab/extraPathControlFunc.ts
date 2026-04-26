import { ExtraPathType, addExtraPath, aliasExtraPath, removeExtraPath } from '@/api/db'
import { globalEvents } from '@/util'
import { open } from '@tauri-apps/api/dialog'
import { checkPathExists } from '@/api'
import { ref } from 'vue'
import { t } from '@/i18n'
import { useGlobalStore } from '@/store/useGlobalStore'
import { isTauri } from '@/util/env'
import { uiDialog, uiMessage } from '@/ui'

export const addToExtraPath = async (initType: ExtraPathType, initPath?: string) => {
  const g = useGlobalStore()
  const type = ref(initType)
  let path = initPath ?? ''

  if (isTauri && !path) {
    const ret = await open({ directory: true, defaultPath: initPath })
    if (typeof ret === 'string') {
      path = ret
    }
  }

  const accessModeTip = g.conf?.enable_access_control
    ? '\n\nAccess Control mode: https://github.com/zanllp/sd-webui-infinite-image-browsing/issues/518'
    : ''
  const input = await uiDialog.prompt({
    title: t('inputTargetFolderPath'),
    message: `${t('inputTargetFolderPath')}${accessModeTip}\n\nWalk: ${t('walkModeDoc')}\nNormal: ${t('normalModelDoc')}\nFixed: ${t('fixedModeDoc')}`,
  })
  path = input || path
  if (!path) {
    uiMessage.error(t('pathIsEmpty'))
    return
  }
  const res = await checkPathExists([path])
  if (!res[path]) {
    uiMessage.error(t('pathDoesNotExist'))
    return
  }
  const confirmed = await uiDialog.confirm({ message: t('confirmToAddToExtraPath') })
  if (!confirmed) return
  await addExtraPath({ types: [type.value], path })
  uiMessage.success(t('addCompleted'))
  globalEvents.emit('searchIndexExpired')
  globalEvents.emit('updateGlobalSetting')
}

export const onRemoveExtraPathClick = async (path: string, type: ExtraPathType) => {
  const confirmed = await uiDialog.confirm({ message: t('confirmDelete'), danger: true })
  if (!confirmed) return
  await removeExtraPath({ types: [type], path })
  uiMessage.success(t('removeCompleted'))
  globalEvents.emit('searchIndexExpired')
  globalEvents.emit('updateGlobalSetting')
}

export const onAliasExtraPathClick = async (path: string) => {
  const alias = await uiDialog.prompt({ title: t('inputAlias'), message: `Path: ${path}` })
  if (!alias) return
  await aliasExtraPath({ alias, path })
  uiMessage.success(t('addAliasCompleted'))
  globalEvents.emit('updateGlobalSetting')
}
