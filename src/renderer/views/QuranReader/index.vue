<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <h1 :class="$style.title">Quran Reader</h1>
      <div :class="$style.controls">
        <button
          :class="$style.navButton"
          :disabled="currentPage <= 1"
          @click="goToPreviousPage"
        >
          Previous
        </button>
        <select
          :class="$style.pageSelect"
          :value="currentPage"
          @change="goToPage(Number($event.target.value))"
        >
          <option v-for="page in availablePages" :key="page" :value="page">
            Page {{ page }}
          </option>
        </select>
        <button
          :class="$style.navButton"
          :disabled="currentPage >= 5"
          @click="goToNextPage"
        >
          Next
        </button>
      </div>
    </div>
    <ReadingView :page-number="currentPage" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@common/utils/vueTools'
import ReadingView from './ReadingView/index.vue'

const currentPage = ref(1)

const availablePages = computed(() => {
  return Array.from({ length: 5 }, (_, i) => i + 1)
})

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToNextPage = () => {
  if (currentPage.value < 5) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= 5) {
    currentPage.value = page
  }
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-content-background);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--color-main-background);
  border-bottom: 1px solid var(--color-primary-alpha-900);
}

.title {
  margin: 0;
  color: var(--color-font);
  font-size: 24px;
  font-weight: bold;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.navButton {
  padding: 8px 16px;
  background-color: var(--color-primary-background);
  color: var(--color-primary-font);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-background-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pageSelect {
  padding: 8px 12px;
  background-color: var(--color-content-background);
  color: var(--color-font);
  border: 1px solid var(--color-primary-alpha-600);
  border-radius: 4px;
  cursor: pointer;
}
</style>
