<script setup lang="ts">
import DraggingPort from './DraggingPort.vue'
import TiktokViewer from './TiktokViewer.vue'
import { useImgSliStore } from '@/store/useImgSli'
import ImgSliSplitPane from './ImgSliComparePane.vue'
import { ref } from 'vue'

const sli = useImgSliStore()
const splitpane = ref<{ requestFullScreen (): void }>()
</script>
<template>
  <v-dialog v-model="sli.drawerVisible" fullscreen class="img-sli">
    <div>
      <ImgSliSplitPane ref="splitpane" container="drawer" v-if="sli.left && sli.right" :left="sli.left"
        :right="sli.right" />
      <div class="actions">
        <v-btn @click="sli.drawerVisible = false">{{ $t('close') }}</v-btn>
        <v-btn @click="splitpane?.requestFullScreen()">{{ $t('fullscreenview') }}</v-btn>
        <v-alert :text="'👇 ' + $t('scrollDownToComparePrompt')" color="info" icon />
      </div>
    </div>
  </v-dialog>
  <DraggingPort />
  <TiktokViewer />
</template>


<style lang="scss" scoped>
.actions {
  display: flex;
  flex-direction: row;
}
</style>
<style lang="scss">
.img-sli {

  .default-theme {
    .splitpanes__splitter {
      background-color: var(--zp-tertiary);
      position: relative;
      width: 4px;
    }


    .splitpanes__pane {
      background: var(--zp-primary-background);
    }

  }
}
</style>