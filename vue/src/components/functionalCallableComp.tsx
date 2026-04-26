import * as Path from '@/util/path'
import { FileNodeInfo, mkdirs } from '@/api/files'
import { t } from '@/i18n'
import { globalEvents } from '@/util'
import { addCustomTag, getDbBasicInfo, rebuildImageIndex, renameFile } from '@/api/db'
import { useGlobalStore } from '@/store/useGlobalStore'
import { useMediaModalStore } from '@/store/useMediaModalStore'
import { uiMessage, uiDialog } from '@/ui'

export const openCreateFlodersModal = async (base: string) => {
  const name = await uiDialog.prompt({
    title: t('inputFolderName'),
    message: '',
  })
  if (!name) return
  const dest = Path.join(base, name)
  await mkdirs(dest)
}

export const MultiSelectTips = () => (
  <p
    style={{
      background: 'var(--zp-secondary-background)',
      padding: '8px',
      borderLeft: '4px solid var(--primary-color)'
    }}
  >
    Tips: {t('multiSelectTips')}
  </p>
)

export const openVideoModal = (
  file: FileNodeInfo,
  onTagClick?: (id: string| number) => void,
  onTiktokView?: () => void
) => {
  useMediaModalStore().open({ file, mediaType: 'video', onTagClick, onTiktokView })
}

export const openAudioModal = (
  file: FileNodeInfo,
  onTagClick?: (id: string| number) => void,
  onTiktokView?: () => void
) => {
  useMediaModalStore().open({ file, mediaType: 'audio', onTagClick, onTiktokView })
}

export const openRebuildImageIndexModal = () => {
  uiDialog.confirm({
    title: t('confirmRebuildImageIndex'),
    message: '',
    okText: t('confirm'),
    cancelText: t('cancel'),
  }).then(async (confirmed) => {
    if (!confirmed) return
    await rebuildImageIndex()
    globalEvents.emit('searchIndexExpired')
    uiMessage.success(t('rebuildComplete'))
  })
}

export const openRenameFileModal = (path: string) => {
  const currentName = path.split(/[\\/]/).pop() ?? ''
  return uiDialog.prompt({
    title: t('rename'),
    message: '',
    initialValue: currentName,
  }).then(async (name) => {
    if (!name) throw new Error('cancel')
    const resp = await renameFile({ path, name })
    return resp.new_path
  })
}

export const openAddNewTagModal = () => {
  return uiDialog.prompt({
    title: t('addNewCustomTag'),
    message: '',
  }).then(async (name) => {
    if (!name) throw new Error('cancel')
    const global = useGlobalStore()
    const info = await getDbBasicInfo()
    const tag = await addCustomTag({ tag_name: name })
    if (tag.type !== 'custom') {
      uiMessage.error(t('existInOtherType'))
      throw new Error(t('existInOtherType'))
    }
    if (info.tags.find((v) => v.id === tag.id)) {
      uiMessage.error(t('alreadyExists'))
      throw new Error(t('alreadyExists'))
    } else {
      global.conf?.all_custom_tags.push(tag)
      uiMessage.success(t('success'))
    }
    return name
  })
}

export const openEditPromptModal = async (file: FileNodeInfo) => {
  globalEvents.off('promptEditorUpdated')
  return new Promise<void>((resolve) => {
    const handler = () => {
      globalEvents.off('promptEditorUpdated', handler)
      resolve()
    }
    globalEvents.on('promptEditorUpdated', handler)
    globalEvents.emit('openPromptEditor', { file })
  })
}
