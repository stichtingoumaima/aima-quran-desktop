<template>
  <div :class="$style.pageContainer">
    <div :class="$style.page">
      <Line
        v-for="lineNumber in 15"
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
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.pageContainer {
  direction: rtl;
  border-bottom: 1px solid #e0e0e0;
  margin-top: 2rem;
  margin-bottom: 2rem;
  max-width: 100%;
  background-color: var(--color-content-background);
}

.page {
  width: 100%;
  max-width: 800px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pageFooter {
  text-align: center;
  font-size: 14px;
  color: var(--color-font-label);
  padding-top: 20px;
  border-top: 1px solid var(--color-primary-alpha-900);
}
</style>
