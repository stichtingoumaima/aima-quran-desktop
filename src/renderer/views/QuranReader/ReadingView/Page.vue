<template>
  <div :class="$style.pageContainer">
    <div :class="$style.page">
      <Line
        v-for="lineNumber in linesWithContent"
        :key="`line-${lineNumber}`"
        :words="getWordsForLine(lineNumber)"
        :line-number="lineNumber"
        :page-number="pageNumber"
        :is-center-aligned="isLineCenterAligned(lineNumber)"
      />
      <div :class="$style.pageFooter">
        {{ pageNumber }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@common/utils/vueTools'
import type { QuranVerse, QuranWord } from '@renderer/types/quran'
import { groupLinesByVerses } from './groupLinesByVerses'

import Line from './Line.vue'

interface Props {
  verses: QuranVerse[]
  pageNumber: number
}

const props = defineProps<Props>()

const lineGroups = computed(() => {
  return groupLinesByVerses(props.verses)
})

// Center-aligned lines mapping (from Quran.com specification)
const CENTER_ALIGNED_LINES: Record<number, number[]> = {
  255: [2],
  528: [9],
  534: [6],
  545: [6],
  586: [1],
  593: [2],
  594: [5],
  600: [10],
  602: [5, 15],
  603: [10, 15],
  604: [4, 9, 14, 15],
}

const isLineCenterAligned = (lineNumber: number): boolean => {
  // Pages 1 and 2 are fully center-aligned
  if (props.pageNumber === 1 || props.pageNumber === 2) {
    return true
  }

  // Check specific lines for other pages
  return CENTER_ALIGNED_LINES[props.pageNumber]?.includes(lineNumber) || false
}

const getWordsForLine = (lineNumber: number): QuranWord[] => {
  const lineKey = `Page${props.pageNumber}-Line${lineNumber}`
  const words = lineGroups.value[lineKey] || []
  return words
}

// Get only lines that have content to avoid empty lines
const linesWithContent = computed(() => {
  const lines: number[] = []
  for (let i = 1; i <= 15; i++) {
    const words = getWordsForLine(i)
    if (words.length > 0) {
      lines.push(i)
    }
  }
  return lines
})
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.pageContainer {
  direction: rtl;
  max-width: 100%;
  background-color: var(--color-main-background);
  padding: 20px;
  display: flex;
  justify-content: center;
}

.page {
  width: 100%;
  max-width: 800px;
  background-color: var(--color-main-background);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pageFooter {
  text-align: center;
  font-size: 14px;
  color: var(--color-font-label);
  padding-top: 20px;
  margin-top: 20px;
}
</style>
