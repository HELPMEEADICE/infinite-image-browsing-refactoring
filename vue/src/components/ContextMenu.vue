<script setup lang="ts">
import type { Tag } from '@/api/db'
import type { FileNodeInfo } from '@/api/files'
import { isMediaFile } from '@/util'
import { StarFilled, StarOutlined } from '@/icon'
import { useGlobalStore } from '@/store/useGlobalStore'
import { computed } from 'vue'

export interface ContextMenuInfo {
  key: string
}

const global = useGlobalStore()
const props = defineProps<{
  file: FileNodeInfo
  idx: number,
  selectedTag: Tag[],
  isSelectedMutilFiles?: boolean
}>()
const emit = defineEmits<{
  (type: 'contextMenuClick', e: ContextMenuInfo, file: FileNodeInfo, idx: number): void
}>()

const tags = computed(() => {
  return (global.conf?.all_custom_tags ?? []).reduce((p, c) => {
    return [...p, { ...c, selected: !!props.selectedTag.find((v) => v.id === c.id) }]
  }, [] as (Tag & { selected: boolean })[])
})

const click = (key: string) => emit('contextMenuClick', { key }, props.file, props.idx)
</script>
<template>
  <v-list density="compact" min-width="260">
    <v-list-item @click="click('deleteFiles')"><v-list-item-title>{{ $t('deleteSelected') }}</v-list-item-title></v-list-item>
    <v-list-item @click="click('openWithDefaultApp')"><v-list-item-title>{{ $t('openWithDefaultApp') }}</v-list-item-title></v-list-item>
    <v-list-item @click="click('saveSelectedAsJson')"><v-list-item-title>{{ $t('saveSelectedAsJson') }}</v-list-item-title></v-list-item>
    <template v-if="file.type === 'dir'">
      <v-list-item @click="click('openInNewTab')"><v-list-item-title>{{ $t('openInNewTab') }}</v-list-item-title></v-list-item>
      <v-list-item @click="click('openOnTheRight')"><v-list-item-title>{{ $t('openOnTheRight') }}</v-list-item-title></v-list-item>
      <v-list-item @click="click('openWithWalkMode')"><v-list-item-title>{{ $t('openWithWalkMode') }}</v-list-item-title></v-list-item>
    </template>
    <template v-if="file.type === 'file'">
      <template v-if="isMediaFile(file.name)">
        <v-list-item @click="click('viewGenInfo')"><v-list-item-title>{{ $t('viewGenerationInfo') }}</v-list-item-title></v-list-item>
        <v-list-item @click="click('tiktokView')"><v-list-item-title>{{ $t('tiktokView') }}</v-list-item-title></v-list-item>
        <v-divider />
        <template v-if="global.conf?.launch_mode !== 'server'">
          <v-list-item @click="click('send2txt2img')"><v-list-item-title>{{ $t('sendToTxt2img') }}</v-list-item-title></v-list-item>
          <v-list-item @click="click('send2img2img')"><v-list-item-title>{{ $t('sendToImg2img') }}</v-list-item-title></v-list-item>
          <v-list-item @click="click('send2inpaint')"><v-list-item-title>{{ $t('sendToInpaint') }}</v-list-item-title></v-list-item>
          <v-list-item @click="click('send2extras')"><v-list-item-title>{{ $t('sendToExtraFeatures') }}</v-list-item-title></v-list-item>
          <v-list-group value="sendToThirdPartyExtension">
            <template #activator="{ props: p }"><v-list-item v-bind="p" :title="$t('sendToThirdPartyExtension')" /></template>
            <v-list-item @click="click('send2controlnet-txt2img')"><v-list-item-title>ControlNet - {{ $t('t2i') }}</v-list-item-title></v-list-item>
            <v-list-item @click="click('send2controlnet-img2img')"><v-list-item-title>ControlNet - {{ $t('i2i') }}</v-list-item-title></v-list-item>
            <v-list-item @click="click('send2outpaint')"><v-list-item-title>openOutpaint</v-list-item-title></v-list-item>
          </v-list-group>
        </template>
        <v-list-item @click="click('send2BatchDownload')"><v-list-item-title>{{ $t('sendToBatchDownload') }}</v-list-item-title></v-list-item>
        <v-list-group value="copy2target">
          <template #activator="{ props: p }"><v-list-item v-bind="p" :title="$t('copyTo')" /></template>
          <v-list-item v-for="path in global.quickMovePaths" :key="`copy-to-${path.dir}`" @click="click(`copy-to-${path.dir}`)"><v-list-item-title>{{ path.zh }}</v-list-item-title></v-list-item>
        </v-list-group>
        <v-list-group value="move2target">
          <template #activator="{ props: p }"><v-list-item v-bind="p" :title="$t('moveTo')" /></template>
          <v-list-item v-for="path in global.quickMovePaths" :key="`move-to-${path.dir}`" @click="click(`move-to-${path.dir}`)"><v-list-item-title>{{ path.zh }}</v-list-item-title></v-list-item>
        </v-list-group>
        <v-divider />
        <template v-if="isSelectedMutilFiles">
          <v-list-group value="batch-add-tag">
            <template #activator="{ props: p }"><v-list-item v-bind="p" :title="$t('batchAddTag')" /></template>
            <v-list-item @click="click('add-custom-tag')"><v-list-item-title>+ {{ $t('addNewCustomTag') }}</v-list-item-title></v-list-item>
            <v-list-item v-for="tag in tags" :key="`batch-add-tag-${tag.id}`" @click="click(`batch-add-tag-${tag.id}`)"><v-list-item-title>{{ tag.name }}</v-list-item-title></v-list-item>
          </v-list-group>
          <v-list-group value="batch-remove-tag">
            <template #activator="{ props: p }"><v-list-item v-bind="p" :title="$t('batchRemoveTag')" /></template>
            <v-list-item v-for="tag in tags" :key="`batch-remove-tag-${tag.id}`" @click="click(`batch-remove-tag-${tag.id}`)"><v-list-item-title>{{ tag.name }}</v-list-item-title></v-list-item>
          </v-list-group>
        </template>
        <v-list-group v-else value="toggle-tag">
          <template #activator="{ props: p }"><v-list-item v-bind="p" :title="$t('toggleTag')" /></template>
          <v-list-item @click="click('add-custom-tag')"><v-list-item-title>+ {{ $t('addNewCustomTag') }}</v-list-item-title></v-list-item>
          <v-list-item v-for="tag in tags" :key="`toggle-tag-${tag.id}`" @click="click(`toggle-tag-${tag.id}`)">
            <v-list-item-title>{{ tag.name }} <star-filled v-if="tag.selected" /><star-outlined v-else /></v-list-item-title>
          </v-list-item>
        </v-list-group>
        <v-divider />
        <v-list-item @click="click('openFileLocationInNewTab')"><v-list-item-title>{{ $t('openFileLocationInNewTab') }}</v-list-item-title></v-list-item>
        <v-list-item @click="click('openWithLocalFileBrowser')"><v-list-item-title>{{ $t('openWithLocalFileBrowser') }}</v-list-item-title></v-list-item>
      </template>
      <v-divider />
      <v-list-item @click="click('rename')"><v-list-item-title>{{ $t('rename') }}</v-list-item-title></v-list-item>
      <v-list-item @click="click('previewInNewWindow')"><v-list-item-title>{{ $t('previewInNewWindow') }}</v-list-item-title></v-list-item>
      <v-list-item @click="click('download')"><v-list-item-title>{{ $t('download') }}</v-list-item-title></v-list-item>
      <v-list-item @click="click('copyPreviewUrl')"><v-list-item-title>{{ $t('copySourceFilePreviewLink') }}</v-list-item-title></v-list-item>
      <v-list-item @click="click('copyFilePath')"><v-list-item-title>{{ $t('copyFilePath') }}</v-list-item-title></v-list-item>
    </template>
  </v-list>
</template>
