# QCF Glyph Font Implementation Guide

This document contains detailed instructions for implementing QCF (Quran Complex Font) glyph-based fonts for pixel-perfect Mushaf replication, to be implemented after the basic QPC Hafs version is working.

## Overview

QCF fonts use glyph-based rendering where each word is encoded as Unicode characters that map to precisely positioned glyphs in page-specific font files. This achieves pixel-perfect replication of the physical Mushaf.

## 1. Font Loading Strategy

### 1.1 Font File Structure
```
resources/fonts/quran/hafs/
├── v1/woff2/p1.woff2, p2.woff2, ..., p604.woff2
├── v2/woff2/p1.woff2, p2.woff2, ..., p604.woff2
└── v4/colrv1/woff2/p1.woff2, ..., p604.woff2
```

### 1.2 Font Loading Implementation
Create `src/renderer/views/QuranReader/ReadingView/useQcfFont.ts`:

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

interface FontFace {
  family: string
  source: string
  loaded: boolean
}

const loadedFonts = ref<Map<string, FontFace>>(new Map())

export function useQcfFont() {
  const loadPageFont = async (pageNumber: number, version: 'v1' | 'v2' | 'v4' = 'v2') => {
    const fontFamily = `p${pageNumber}-${version}`
    
    if (loadedFonts.value.has(fontFamily)) {
      return loadedFonts.value.get(fontFamily)!
    }

    const fontPath = `/resources/fonts/quran/hafs/${version}/woff2/p${pageNumber}.woff2`
    
    try {
      const fontFace = new FontFace(fontFamily, `url(${fontPath})`)
      await fontFace.load()
      document.fonts.add(fontFace)
      
      const fontData: FontFace = {
        family: fontFamily,
        source: fontPath,
        loaded: true,
      }
      
      loadedFonts.value.set(fontFamily, fontData)
      console.log(`✅ Loaded QCF font: ${fontFamily}`)
      return fontData
    } catch (error) {
      console.error(`❌ Failed to load QCF font: ${fontFamily}`, error)
      throw error
    }
  }

  const isFontLoaded = (pageNumber: number, version: 'v1' | 'v2' | 'v4' = 'v2') => {
    const fontFamily = `p${pageNumber}-${version}`
    return loadedFonts.value.has(fontFamily) && loadedFonts.value.get(fontFamily)!.loaded
  }

  return {
    loadPageFont,
    isFontLoaded,
    loadedFonts: loadedFonts.value,
  }
}
```

## 2. Component Updates

### 2.1 Update QuranWord Component
Modify `src/renderer/views/QuranReader/ReadingView/QuranWord.vue`:

```vue
<template>
  <span 
    :class="[$style.word, fontClass]"
    :style="fontStyle"
  >
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQcfFont } from './useQcfFont'
import type { QuranWord } from '@renderer/types/quran'

interface Props {
  word: QuranWord
  pageNumber: number
  fontVersion?: 'v1' | 'v2' | 'v4'
}

const props = withDefaults(defineProps<Props>(), {
  fontVersion: 'v2',
})

const { isFontLoaded, loadPageFont } = useQcfFont()

const fontClass = computed(() => {
  return isFontLoaded(props.pageNumber, props.fontVersion) 
    ? $style.qcfFont 
    : $style.fallbackFont
})

const fontStyle = computed(() => {
  if (isFontLoaded(props.pageNumber, props.fontVersion)) {
    return {
      fontFamily: `p${props.pageNumber}-${props.fontVersion}`,
    }
  }
  return {}
})

const displayText = computed(() => {
  if (isFontLoaded(props.pageNumber, props.fontVersion)) {
    // Use glyph code for QCF fonts
    return props.word.codeV2 || props.word.codeV1 || props.word.qpcUthmaniHafs || ''
  }
  // Fallback to text
  return props.word.qpcUthmaniHafs || props.word.textUthmani || props.word.text || ''
})

// Load font when component mounts
watch(() => props.pageNumber, async () => {
  try {
    await loadPageFont(props.pageNumber, props.fontVersion)
  } catch (error) {
    console.warn('Font loading failed, using fallback:', error)
  }
}, { immediate: true })
</script>

<style lang="less" module>
.word {
  display: inline;
  direction: rtl;
  unicode-bidi: bidi-override;
  margin-left: 2px;
  margin-right: 2px;
}

.qcfFont {
  // QCF font specific styling
}

.fallbackFont {
  font-family: 'QPC-Uthmanic-Hafs', 'Amiri', 'Scheherazade', 'Arial Unicode MS', sans-serif;
}
</style>
```

### 2.2 Update VerseText Component
Modify `src/renderer/views/QuranReader/ReadingView/VerseText.vue` to pass pageNumber to QuranWord:

```vue
<template>
  <div :class="[$style.verseText, textAlignClass]">
    <QuranWord 
      v-for="word in words" 
      :key="`word-${word.id}-${word.position}`"
      :word="word"
      :page-number="pageNumber"
    />
  </div>
</template>
```

## 3. API Changes

### 3.1 Update pageReader.js
Modify `src/renderer/utils/musicSdk/quran/pageReader.js`:

```javascript
// Change mushaf parameter to 2 for QCF V2
getVersesByPage(pageNumber, mushaf = 2) {
  const wordFields = 'verse_key,page_number,location,code_v1,code_v2,qpc_uthmani_hafs'
  // ... rest of implementation
}
```

### 3.2 Update Type Definitions
Modify `src/renderer/types/quran.d.ts`:

```typescript
interface QuranWord {
  id: number
  position: number
  pageNumber: number
  lineNumber: number
  text: string
  textUthmani: string
  qpcUthmaniHafs: string
  codeV1: string  // QCF V1 glyph code
  codeV2: string  // QCF V2 glyph code
  verseKey: string
  location: string
}
```

## 4. Font Scale System

### 4.1 Create Font Scale Utility
Create `src/renderer/views/QuranReader/ReadingView/useFontScale.ts`:

```typescript
export function useFontScale() {
  const getFontSize = (scale: number, isMobile: boolean = false) => {
    const scales = {
      desktop: {
        madaniV1: [6.1, 6, 5.8, 5.4, 5, 8, 11, 14, 17, 20],
        madaniV2: [6.1, 6.1, 6.1, 6.1, 6.1, 9.28, 12.46, 15.64, 18.82, 22],
        qpcHafs: [3.2, 3.5, 4, 4, 4.4, 5.56, 6.72, 7.88, 9.04, 10.27],
        indopak15: [3.2, 3.5, 4, 4, 4.4, 5.71, 7.02, 8.33, 9.64, 10.95],
        indopak16: [3, 3.3, 3.75, 3.75, 4.13, 5.03, 5.93, 6.83, 7.73, 8.63],
      },
      mobile: {
        default: [4, 4.5, 5, 8.9, 11, 12, 13, 14, 15, 16],
      },
    }

    if (isMobile) {
      return `${scales.mobile.default[scale - 1]}vw`
    }
    
    // Use QPC Hafs scale for now
    return `${scales.desktop.qpcHafs[scale - 1]}vh`
  }

  return { getFontSize }
}
```

### 4.2 Generate CSS Classes
Create `src/renderer/assets/styles/qcf-font-scales.less`:

```less
// Generate font scale classes for QCF fonts
@for $i from 1 through 10 {
  .qcf-font-size-#{$i} {
    font-size: var(--qcf-font-size-#{$i});
    line-height: var(--qcf-font-size-#{$i});
  }
}

// CSS variables will be set dynamically via JavaScript
```

## 5. Virtualization Implementation

### 5.1 Install Virtual Scrolling
```bash
npm install vue-virtual-scroller
```

### 5.2 Create Virtualized Reading View
Create `src/renderer/views/QuranReader/ReadingView/VirtualizedReadingView.vue`:

```vue
<template>
  <RecycleScroller
    class="scroller"
    :items="pages"
    :item-size="800"
    key-field="pageNumber"
    v-slot="{ item }"
  >
    <PageContainer 
      :page-number="item.pageNumber"
      :key="item.pageNumber"
    />
  </RecycleScroller>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import PageContainer from './PageContainer.vue'

const pages = Array.from({ length: 604 }, (_, i) => ({ pageNumber: i + 1 }))
</script>
```

## 6. Implementation Steps

1. **Phase 1**: Implement font loading system
   - Create `useQcfFont` composable
   - Test font loading for pages 1-5

2. **Phase 2**: Update components for glyph rendering
   - Modify `QuranWord` to use glyph codes
   - Update API to fetch `code_v2` field
   - Test glyph rendering

3. **Phase 3**: Implement font scale system
   - Create font scale utility
   - Add scale controls to UI
   - Test different scales

4. **Phase 4**: Add virtualization
   - Implement virtual scrolling
   - Lazy load fonts as pages scroll into view
   - Test performance with all 604 pages

5. **Phase 5**: Polish and optimization
   - Add font preloading for visible pages
   - Implement font caching
   - Add error handling for missing fonts

## 7. Testing Checklist

- [ ] Font files load correctly from resources directory
- [ ] Glyph codes render properly with QCF fonts
- [ ] Fallback to QPC Hafs when QCF fonts fail
- [ ] Font scales work responsively
- [ ] Virtual scrolling performs well with 604 pages
- [ ] Font loading doesn't block UI
- [ ] Memory usage remains reasonable with many loaded fonts

## 8. Performance Considerations

- **Font Loading**: Load fonts on-demand as pages scroll into view
- **Font Caching**: Cache loaded fonts to prevent reloading
- **Memory Management**: Unload fonts for pages far from viewport
- **Preloading**: Preload fonts for pages adjacent to current view
- **Error Handling**: Graceful fallback when fonts fail to load

## 9. Browser Compatibility

- **FontFace API**: Modern browsers (Chrome 37+, Firefox 41+, Safari 10+)
- **Fallback**: Use QPC Hafs for older browsers
- **Feature Detection**: Check for FontFace support before loading QCF fonts
