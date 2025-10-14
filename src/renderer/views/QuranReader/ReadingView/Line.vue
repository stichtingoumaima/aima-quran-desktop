<template>
  <div :id="lineId" :class="$style.line">
    <VerseText
      :words="words"
      :page-number="pageNumber"
      :line-number="lineNumber"
      :is-center-aligned="isCenterAligned"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from '@common/utils/vueTools'
import type { QuranWord } from '@renderer/types/quran'
import VerseText from './VerseText.vue'

interface Props {
  words: QuranWord[]
  lineNumber: number
  pageNumber: number
  isCenterAligned: boolean
}

const props = defineProps<Props>()

const lineId = computed(() => `Page${props.pageNumber}-Line${props.lineNumber}`)
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.line {
  text-align: center;
  margin-inline: auto;
  direction: rtl;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
</style>
