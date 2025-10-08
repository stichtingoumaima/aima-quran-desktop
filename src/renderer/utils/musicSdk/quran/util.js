// Format reciter data for consistent structure
export const formatReciter = (reciter) => {
  return {
    id: reciter.id,
    name: reciter.reciter_name,
    translatedName: reciter.translated_name,
    language: reciter.language_name,
    style: reciter.style,
    region: reciter.region,
    // Additional metadata
    reciterNameArabic: reciter.reciter_name_arabic,
    languageNameArabic: reciter.language_name_arabic,
    translatedNameArabic: reciter.translated_name_arabic,
    // For compatibility with existing music player
    singer: reciter.reciter_name,
    albumName: reciter.language_name,
    img: 'https://i.ytimg.com/vi/Nnd641CP1k8/maxresdefault.jpg', // Default reciter profile placeholder
    interval: null, // Will be set when audio is loaded
    songmid: reciter.id,
    source: 'quran',
  }
}

// Format surah data for consistent structure
export const formatSurah = (surah) => {
  return {
    id: surah.id,
    name: surah.name_simple,
    nameArabic: surah.name_arabic,
    nameComplex: surah.name_complex,
    versesCount: surah.verses_count,
    revelationOrder: surah.revelation_order,
    revelationPlace: surah.revelation_place,
    // Additional metadata
    translatedName: surah.translated_name,
    // For compatibility with existing music player
    singer: 'Quran',
    albumName: `Surah ${surah.name_simple}`,
    img: null, // Surahs don't have images
    interval: null, // Will be set when audio is loaded
    songmid: surah.id,
    source: 'quran',
  }
}

// Format verse data
export const formatVerse = (verse) => {
  return {
    id: verse.id,
    verseNumber: verse.verse_number,
    surahId: verse.chapter_id,
    textArabic: verse.text_uthmani,
    textSimple: verse.text_simple,
    translations: verse.translations || [],
    audio: verse.audio,
    source: 'quran',
  }
}

// Format audio data
export const formatAudio = (audio) => {
  return {
    id: audio.id,
    url: audio.url,
    format: audio.format,
    duration: audio.duration,
    segments: audio.segments,
    source: 'quran',
  }
}

// Get quality preference
export const getQualityPreference = (availableFormats, preferredQuality = '320k') => {
  const qualityOrder = ['flac', '320k', '256k', '192k', '128k', '64k']

  // First try preferred quality
  if (availableFormats.includes(preferredQuality)) {
    return preferredQuality
  }

  // Then try quality order
  for (const quality of qualityOrder) {
    if (availableFormats.includes(quality)) {
      return quality
    }
  }

  // Fallback to first available
  return availableFormats[0] || '128k'
}

// Format duration from seconds to MM:SS
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Get reciter display name
export const getReciterDisplayName = (reciter) => {
  if (reciter.translatedName && reciter.translatedName !== reciter.name) {
    return `${reciter.name} (${reciter.translatedName})`
  }
  return reciter.name
}

// Get surah display name
export const getSurahDisplayName = (surah) => {
  return `${surah.name} (${surah.nameArabic})`
}

// Validate reciter ID
export const isValidReciterId = (id) => {
  return id && typeof id === 'number' && id > 0
}

// Validate surah ID
export const isValidSurahId = (id) => {
  return id && typeof id === 'number' && id >= 1 && id <= 114
}

// Validate verse ID
export const isValidVerseId = (surahId, verseId) => {
  if (!isValidSurahId(surahId)) return false
  if (!verseId || typeof verseId !== 'number' || verseId < 1) return false

  // Basic validation - in real implementation, you'd check against actual verse counts
  return true
}

// Get audio URL with quality preference
export const getAudioUrlWithQuality = (audioFiles, preferredQuality = '320k') => {
  if (!audioFiles || audioFiles.length === 0) return null

  const availableFormats = audioFiles.map(file => file.format)
  const selectedQuality = getQualityPreference(availableFormats, preferredQuality)

  const selectedFile = audioFiles.find(file => file.format === selectedQuality)
  return selectedFile ? selectedFile.url : audioFiles[0].url
}

// Create search query for reciters
export const createReciterSearchQuery = (query, filters = {}) => {
  let searchQuery = query

  if (filters.language) {
    searchQuery += ` language:${filters.language}`
  }

  if (filters.style) {
    searchQuery += ` style:${filters.style}`
  }

  if (filters.region) {
    searchQuery += ` region:${filters.region}`
  }

  return searchQuery.trim()
}

// Create search query for surahs
export const createSurahSearchQuery = (query, filters = {}) => {
  let searchQuery = query

  if (filters.revelationPlace) {
    searchQuery += ` place:${filters.revelationPlace}`
  }

  if (filters.minVerses) {
    searchQuery += ` verses:>=${filters.minVerses}`
  }

  if (filters.maxVerses) {
    searchQuery += ` verses:<=${filters.maxVerses}`
  }

  return searchQuery.trim()
}
