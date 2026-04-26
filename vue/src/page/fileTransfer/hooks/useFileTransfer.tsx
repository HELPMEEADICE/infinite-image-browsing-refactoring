import { watch } from 'vue'
import {
  useWatchDocument
} from 'vue3-ts-util'
import { FileTransferData, getFileTransferDataFromDragEvent } from '@/util/file'
import type { FileNodeInfo } from '@/api/files'
import { useHookShareState, global, events, sli } from '.'
import { copyFiles, moveFiles } from '@/api/files'
import { t } from '@/i18n'
import { uiDialog, uiMessage } from '@/ui'
import * as Path from '@/util/path'

import { cloneDeep, uniqBy } from 'lodash-es'

export function useFileTransfer () {
  const { currLocation, sortedFiles, currPage, multiSelectedIdxs, eventEmitter, walker } =
    useHookShareState().toRefs()
  const recover = () => {
    multiSelectedIdxs.value = []
  }
  useWatchDocument('click', () => {
    if (!global.keepMultiSelect) {
      recover()
    }
  })
  useWatchDocument('blur', () => {
    if (!global.keepMultiSelect) {
      recover()
    }
  })
  watch(currPage, recover)

  const onFileDragStart = (e: DragEvent, idx: number) => {
    const file = cloneDeep(sortedFiles.value[idx])
    sli.fileDragging = true
    console.log('onFileDragStart set drag file ', e, idx, file)
    const files = [file]
    let includeDir = file.type === 'dir'
    if (multiSelectedIdxs.value.includes(idx)) {
      const selectedFiles = multiSelectedIdxs.value.map((idx) => sortedFiles.value[idx])
      files.push(...selectedFiles)
      includeDir = selectedFiles.some((v) => v.type === 'dir')
    }
    const data: FileTransferData = {
      includeDir,
      loc: currLocation.value || 'search-result',
      path: uniqBy(files, 'fullpath').map((f) => f.fullpath),
      nodes: uniqBy(files, 'fullpath'),
      __id: 'FileTransferData'
    }
    e.dataTransfer!.setData('text/plain', JSON.stringify(data))
  }

  const onFileDragEnd = () => {
    sli.fileDragging = false
  }

  const onDrop = async (e: DragEvent) => {
    if (walker.value) {
      return
    }
    const data = getFileTransferDataFromDragEvent(e)
    if (!data) {
      return
    }
    const toPath = currLocation.value
    if (data.loc === toPath) {
      return
    }
    openMoveOrCopyConfirm(data, toPath)
  }

  const onFileDropToFolder = async (e: DragEvent, target: FileNodeInfo) => {
    if (walker.value || target.type !== 'dir') {
      return false
    }
    const data = getFileTransferDataFromDragEvent(e)
    if (!data) {
      return false
    }
    const fromPath = Path.normalize(data.loc)
    const currPath = Path.normalize(currLocation.value || '')
    if (fromPath !== currPath) {
      return false
    }
    const toPath = Path.normalize(target.fullpath)
    const filtered = data.path
      .map(Path.normalize)
      .filter((p) => p !== toPath && !toPath.startsWith(p + '/'))
    if (!filtered.length) {
      return false
    }
    e.preventDefault()
    openMoveOrCopyConfirm({ ...data, path: filtered }, toPath)
    return true
  }

  const openMoveOrCopyConfirm = async (data: FileTransferData, toPath: string) => {
    const message = `${t('moveSelectedFilesTo')} ${toPath}\n\n${data.path.map((v) => v.split(/[/\\]/).pop()).join('\n')}`
    const shouldMove = await uiDialog.confirm({
      title: t('confirm') + '?',
      message,
      okText: t('move'),
      cancelText: t('copy'),
      maskClosable: true,
    })
    if (shouldMove) {
      await moveFiles(data.path, toPath, false, false)
      events.emit('removeFiles', { paths: data.path, loc: data.loc })
      eventEmitter.value.emit('refresh')
      uiMessage.success(t('moveSuccess'))
    } else {
      await copyFiles(data.path, toPath, false, false)
      eventEmitter.value.emit('refresh')
      uiMessage.success(t('copySuccess'))
    }
  }
  return {
    onFileDragStart,
    onDrop,
    multiSelectedIdxs,
    onFileDragEnd,
    onFileDropToFolder
  }
}
