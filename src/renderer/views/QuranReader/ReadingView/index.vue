<template>
  <div :class="$style.container">
    <div v-if="loading" :class="$style.loading">
      Loading page {{ pageNumber }}...
    </div>
    <div v-else-if="error" :class="$style.error">
      <p>Error loading page {{ pageNumber }}</p>
      <button :class="$style.retryButton" @click="fetchVerses">
        Retry
      </button>
    </div>
    <Page v-else-if="verses && verses.length > 0" :verses="verses" :page-number="pageNumber" />
    <div v-else :class="$style.noData">
      No verses found for page {{ pageNumber }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from '@common/utils/vueTools'
import { apis } from '@renderer/utils/musicSdk/api-source'
import type { QuranVerse } from '@renderer/types/quran'
import Page from './Page.vue'

interface Props {
  pageNumber: number
}

const props = defineProps<Props>()

const verses = ref<QuranVerse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchVerses = async() => {
  if (!props.pageNumber) return

  loading.value = true
  error.value = null

  try {
    console.log('🔄 Fetching verses for page:', props.pageNumber)
    console.log('🔍 apis function:', typeof apis)
    console.log('🔍 apis("quran"):', apis('quran'))
    const response = await apis('quran').getVersesByPage(props.pageNumber)

    // The response is a request object with a promise property
    // We need to await the promise to get the actual data
    const data = await response.promise
    console.log('✅ API data received:', data)

    if (data?.verses) {
      verses.value = data.verses
      console.log('✅ Loaded verses:', data.verses.length)
      console.log('🔍 First verse:', data.verses[0])
      if (data.verses[0]?.words) {
        console.log('🔍 First verse words count:', data.verses[0].words.length)
        console.log('🔍 First word:', data.verses[0].words[0])
      }
    } else {
      console.log('❌ No verses found in data:', data)
      throw new Error('No verses found')
    }
  } catch (err) {
    console.error('❌ Error fetching verses:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

// Watch for page number changes
watch(() => props.pageNumber, () => {
  void fetchVerses()
}, { immediate: true })

onMounted(() => {
  void fetchVerses()
})
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--color-font-label);
  font-size: 16px;
}

.error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--color-font);
  text-align: center;
}

.retryButton {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: var(--color-primary-background);
  color: var(--color-primary-font);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-primary-background-hover);
  }
}

.noData {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--color-font-label);
  font-size: 16px;
}
</style>
