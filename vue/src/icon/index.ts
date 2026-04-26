import { defineComponent, h } from 'vue'
import regex from './regex.svg'
import play from './play.svg'
import fullscreen from './fullscreen.svg'

const iconNameMap: Record<string, string> = {
  AimOutlined: 'my_location',
  AppstoreOutlined: 'apps',
  ArrowDownOutlined: 'arrow_downward',
  ArrowLeftOutlined: 'arrow_back',
  ArrowRightOutlined: 'chevron_right',
  ArrowsAltOutlined: 'open_in_full',
  CaretRightOutlined: 'play_arrow',
  CheckOutlined: 'check',
  CloseCircleOutlined: 'cancel',
  CloseOutlined: 'close',
  CopyOutlined: 'content_copy',
  DatabaseOutlined: 'database',
  DeleteOutlined: 'delete',
  DownOutlined: 'keyboard_arrow_down',
  DownloadOutlined: 'download',
  DragOutlined: 'drag_indicator',
  EditOutlined: 'edit',
  EllipsisOutlined: 'more_horiz',
  FileDoneOutlined: 'draft',
  FileOutlined: 'description',
  FileTextOutlined: 'article',
  FolderOpenOutlined: 'folder_open',
  FullscreenExitOutlined: 'fullscreen_exit',
  FullscreenOutlined: 'fullscreen',
  GithubOutlined: 'code',
  HeartFilled: 'favorite',
  HeartOutlined: 'favorite',
  InfoCircleOutlined: 'info',
  LeftCircleOutlined: 'chevron_left',
  LinkOutlined: 'link',
  LockOutlined: 'lock',
  MailOutlined: 'mail',
  PlayCircleOutlined: 'play_circle',
  PlusOutlined: 'add',
  PushpinFilled: 'push_pin',
  QuestionCircleOutlined: 'help',
  RightCircleOutlined: 'chevron_right',
  SettingOutlined: 'settings',
  SortAscendingOutlined: 'sort_by_alpha',
  SoundFilled: 'volume_up',
  SoundOutlined: 'volume_off',
  StarFilled: 'star',
  StarOutlined: 'star',
  TagsOutlined: 'sell',
  UpOutlined: 'keyboard_arrow_up',
}

const makeIcon = (componentName: string) => defineComponent({
  name: componentName,
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h('span', {
      ...attrs,
      class: ['material-symbols-outlined', attrs.class],
      style: [{ fontSize: '1em', lineHeight: 1, verticalAlign: 'middle', userSelect: 'none' }, attrs.style as any],
    }, iconNameMap[componentName] ?? 'help')
  },
})

export const AimOutlined = makeIcon('AimOutlined')
export const AppstoreOutlined = makeIcon('AppstoreOutlined')
export const ArrowDownOutlined = makeIcon('ArrowDownOutlined')
export const ArrowLeftOutlined = makeIcon('ArrowLeftOutlined')
export const ArrowRightOutlined = makeIcon('ArrowRightOutlined')
export const ArrowsAltOutlined = makeIcon('ArrowsAltOutlined')
export const CaretRightOutlined = makeIcon('CaretRightOutlined')
export const CheckOutlined = makeIcon('CheckOutlined')
export const CloseCircleOutlined = makeIcon('CloseCircleOutlined')
export const CloseOutlined = makeIcon('CloseOutlined')
export const CopyOutlined = makeIcon('CopyOutlined')
export const DatabaseOutlined = makeIcon('DatabaseOutlined')
export const DeleteOutlined = makeIcon('DeleteOutlined')
export const DownOutlined = makeIcon('DownOutlined')
export const DownloadOutlined = makeIcon('DownloadOutlined')
export const DragOutlined = makeIcon('DragOutlined')
export const EditOutlined = makeIcon('EditOutlined')
export const EllipsisOutlined = makeIcon('EllipsisOutlined')
export const FileDoneOutlined = makeIcon('FileDoneOutlined')
export const FileOutlined = makeIcon('FileOutlined')
export const FileTextOutlined = makeIcon('FileTextOutlined')
export const FolderOpenOutlined = makeIcon('FolderOpenOutlined')
export const FullscreenExitOutlined = makeIcon('FullscreenExitOutlined')
export const FullscreenOutlined = makeIcon('FullscreenOutlined')
export const GithubOutlined = makeIcon('GithubOutlined')
export const HeartFilled = makeIcon('HeartFilled')
export const HeartOutlined = makeIcon('HeartOutlined')
export const InfoCircleOutlined = makeIcon('InfoCircleOutlined')
export const LeftCircleOutlined = makeIcon('LeftCircleOutlined')
export const LinkOutlined = makeIcon('LinkOutlined')
export const LockOutlined = makeIcon('LockOutlined')
export const MailOutlined = makeIcon('MailOutlined')
export const PlayCircleOutlined = makeIcon('PlayCircleOutlined')
export const PlusOutlined = makeIcon('PlusOutlined')
export const PushpinFilled = makeIcon('PushpinFilled')
export const QuestionCircleOutlined = makeIcon('QuestionCircleOutlined')
export const RightCircleOutlined = makeIcon('RightCircleOutlined')
export const SettingOutlined = makeIcon('SettingOutlined')
export const SortAscendingOutlined = makeIcon('SortAscendingOutlined')
export const SoundFilled = makeIcon('SoundFilled')
export const SoundOutlined = makeIcon('SoundOutlined')
export const StarFilled = makeIcon('StarFilled')
export const StarOutlined = makeIcon('StarOutlined')
export const TagsOutlined = makeIcon('TagsOutlined')
export const UpOutlined = makeIcon('UpOutlined')

export {
  regex,
  play,
  fullscreen
}
