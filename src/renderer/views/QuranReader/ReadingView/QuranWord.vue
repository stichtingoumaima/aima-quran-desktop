<template>
  <span v-if="isVerseNumber" :class="$style.verseNumber">{{ displayText }}</span>
  <span v-else :class="$style.word">{{ displayText }}</span>
</template>

<script setup lang="ts">
import { computed } from '@common/utils/vueTools'
import type { QuranWord } from '@renderer/types/quran'

interface Props {
  word: QuranWord
}

const props = defineProps<Props>()

const displayText = computed(() => {
  // Prioritize Arabic text fields over single glyph characters
  return (props.word as any).qpc_uthmani_hafs ?? (props.word as any).text_uthmani ??
         props.word.qpcUthmaniHafs ?? props.word.textUthmani ??
         props.word.text ?? (props.word as any).text ?? ''
})

const isVerseNumber = computed(() => {
  // Check if this word is a verse number (char_type_name: 'end')
  return (props.word as any).char_type_name === 'end' || props.word.charTypeName === 'end'
})
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.word {
  display: inline;
  line-height: inherit;
  font-size: inherit;
  color: inherit;
  margin-left: 2px;
  margin-right: 2px;
}

.verseNumber {
  display: inline-block;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--color-primary-background);
  color: var(--color-primary-font);
  font-size: 1rem;
  line-height: 30px;
  text-align: center;
  margin-left: 8px;
  margin-right: 8px;
  font-weight: bold;
}
</style>
