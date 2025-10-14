interface QuranWord {
  id: number
  position: number
  pageNumber?: number
  lineNumber?: number
  page_number?: number
  line_number?: number
  text: string
  textUthmani?: string
  qpcUthmaniHafs?: string
  textIndopak?: string
  codeV1?: string
  codeV2?: string
  verseKey?: string
  location?: string
  audioUrl?: string
  audio_url?: string
  charTypeName?: string
  char_type_name?: string
  translation?: {
    text: string
    languageName: string
    languageId: number
  }
  transliteration?: {
    text: string
    languageName: string
    languageId: number
  }
}

interface QuranVerse {
  id: number
  verseNumber: number
  chapterId: number
  pageNumber: number
  verseKey: string
  words: QuranWord[]
  textUthmani: string
}

interface QuranPageResponse {
  verses: QuranVerse[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalRecords: number
  }
}

type LineGroup = Record<string, QuranWord[]>

export type {
  QuranWord,
  QuranVerse,
  QuranPageResponse,
  LineGroup,
}
