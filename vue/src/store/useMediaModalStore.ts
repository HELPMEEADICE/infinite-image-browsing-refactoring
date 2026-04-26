import { defineStore } from 'pinia'
import type { FileNodeInfo } from '@/api/files'

export interface MediaModalState {
  visible: boolean
  file: FileNodeInfo | null
  mediaType: 'video' | 'audio'
  onTagClick: ((id: string | number) => void) | null
  onTiktokView: (() => void) | null
}

export const useMediaModalStore = defineStore('media_modal', {
  state: (): MediaModalState => ({
    visible: false,
    file: null,
    mediaType: 'video',
    onTagClick: null,
    onTiktokView: null,
  }),
  actions: {
    open(opts: { file: FileNodeInfo; mediaType: 'video' | 'audio'; onTagClick?: (id: string | number) => void; onTiktokView?: () => void }) {
      this.file = opts.file
      this.mediaType = opts.mediaType
      this.onTagClick = opts.onTagClick ?? null
      this.onTiktokView = opts.onTiktokView ?? null
      this.visible = true
    },
    close() {
      this.visible = false
      this.file = null
      this.onTagClick = null
      this.onTiktokView = null
    },
  },
})
