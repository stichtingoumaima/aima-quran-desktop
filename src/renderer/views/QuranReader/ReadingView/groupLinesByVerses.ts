import type { QuranVerse, QuranWord, LineGroup } from '@renderer/types/quran'

/**
 * Groups verses into lines for rendering
 * @param verses Array of verses from API
 * @returns Object with line keys mapping to word arrays
 */
export function groupLinesByVerses(verses: QuranVerse[]): LineGroup {
  if (!verses || !Array.isArray(verses)) {
    console.warn('groupLinesByVerses: Invalid verses input')
    return {}
  }

  // Flatten all words from all verses
  const allWords: QuranWord[] = verses.flatMap(verse => verse.words || [])

  // Group words by line number
  const lineGroups: LineGroup = {}

  allWords.forEach((word) => {
    // Only render words and verse numbers (end markers)
    const charType = (word as any).char_type_name || word.charTypeName
    if (!charType || !['word', 'end'].includes(charType)) {
      return
    }
    
    // Check for different possible field names (API might return snake_case)
    const lineNumber = word.lineNumber || (word as any).line_number
    const pageNumber = word.pageNumber || (word as any).page_number
    
    if (!word || typeof lineNumber !== 'number' || typeof pageNumber !== 'number') {
      console.warn('groupLinesByVerses: Invalid word structure:', word)
      return
    }
    
    const lineKey = `Page${pageNumber}-Line${lineNumber}`
    
    if (!lineGroups[lineKey]) {
      lineGroups[lineKey] = []
    }
    
    lineGroups[lineKey].push(word)
  })

  // Sort words within each line by verse order first, then position within verse
  Object.keys(lineGroups).forEach(lineKey => {
    const words = lineGroups[lineKey]
    if (words.length > 0) {
      // Sort by verse order first, then by position within each verse
      words.sort((a, b) => {
        const verseA = (a as any).verse_key
        const verseB = (b as any).verse_key
        
        // If different verses, sort by verse order
        if (verseA !== verseB) {
          const [chapterA, verseNumA] = verseA.split(':').map(Number)
          const [chapterB, verseNumB] = verseB.split(':').map(Number)
          
          if (chapterA !== chapterB) return chapterA - chapterB
          return verseNumA - verseNumB
        }
        
        // Same verse, sort by position
        return a.position - b.position
      })
    }
  })


  return lineGroups
}

/**
 * Get line numbers for a specific page
 * @param pageNumber Page number
 * @returns Array of line numbers (1-15)
 */
export function getPageLineNumbers(pageNumber: number): number[] {
  return Array.from({ length: 15 }, (_, i) => i + 1)
}

/**
 * Generate line key for a specific page and line
 * @param pageNumber Page number
 * @param lineNumber Line number (1-15)
 * @returns Line key string
 */
export function generateLineKey(pageNumber: number, lineNumber: number): string {
  return `Page${pageNumber}-Line${lineNumber}`
}
