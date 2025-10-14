<template>
  <div :class="[$style.verseText, alignmentClass]">
    <QuranWord
      v-for="word in words"
      :key="`word-${word.id}-${word.position}`"
      :word="word"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from '@common/utils/vueTools'
import type { QuranWord as QuranWordType } from '@renderer/types/quran'
import QuranWord from './QuranWord.vue'

interface Props {
  words: QuranWordType[]
  pageNumber: number
  lineNumber: number
  isCenterAligned: boolean
}

const props = defineProps<Props>()

const alignmentClass = computed(() => {
  return props.isCenterAligned ? 'center' : 'space-between'
})

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.verseText {
  display: flex;
  align-items: flex-start;
  line-height: 5.8vh; /* Default scale 3 for Madani V1 */
  direction: rtl;
  width: 100%;
  font-family: 'QPC-Uthmanic-Hafs', 'Amiri', 'Scheherazade', 'Arial Unicode MS', sans-serif;
  font-size: 5.8vh; /* Default scale 3 for Madani V1 */
  color: var(--color-font);
}

/* Mobile responsive design */
@media (max-width: 767px) {
  .verseText {
    font-size: 5vw; /* Mobile scale 3 */
    line-height: normal;
  }
}

/* Center aligned (pages 1, 2, and specific lines) */
.center {
  justify-content: center;
}

/* Space between (most lines) */
.space-between {
  justify-content: space-between;
}
</style>
