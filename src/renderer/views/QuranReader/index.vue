<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <div :class="$style.left">
        <div :class="$style.navigation">
          <base-btn
            :class="$style.navButton"
            :disabled="currentPage <= 1"
            outline
            min
            @click="goToPreviousPage"
          >
            Previous
          </base-btn>
          <base-selection
            :model-value="currentPage"
            :class="$style.pageSelect"
            :list="pageList"
            item-key="value"
            item-name="name"
            @update:model-value="goToPage"
          />
          <base-btn
            :class="$style.navButton"
            :disabled="currentPage >= 5"
            outline
            min
            @click="goToNextPage"
          >
            Next
          </base-btn>
        </div>
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

const pageList = computed(() => {
  return availablePages.value.map(page => ({
    value: page,
    name: `Page ${page}`,
  }))
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
  background-color: var(--color-main-background);
}

.header {
  flex: none;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  padding-bottom: 5px;
}

.left {
  flex: auto;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 20px;
}


.navigation {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.navButton {
  // base-btn styling is handled by the component
}

.pageSelect {
  // base-selection styling is handled by the component
}
</style>
