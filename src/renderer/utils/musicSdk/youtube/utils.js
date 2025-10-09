/**
 * Utility functions for YouTube Music SDK
 * These functions help process YouTube data and transform it to the music SDK format
 */

/**
 * Format duration from seconds to HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Extract reciter name from YouTube video title
 * @param {string} title - Video title
 * @returns {string} Extracted reciter name
 */
export const extractReciterFromTitle = (title) => {
  if (!title) return 'Unknown Reciter'

  // Common patterns for Quran recitation titles
  const patterns = [
    /(?:by|from|recited by|recitation by)\s+([^-\n]+)/i,
    /([^-\n]+)\s+(?:recitation|recites|quran)/i,
    /surah\s+[^-\n]+\s*-\s*([^-\n]+)/i,
    /([^-\n]+)\s*-\s*surah/i,
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  // Fallback: try to extract from channel name or return first part
  return title && typeof title === 'string' ? title.split('-')[0]?.trim() || 'Unknown Reciter' : 'Unknown Reciter'
}

/**
 * Extract surah information from YouTube video title
 * @param {string} title - Video title
 * @returns {object} Object with surah number and name
 */
export const extractSurahFromTitle = (title) => {
  if (!title) return { number: null, name: null }

  // Pattern to match surah numbers (1-114)
  const numberMatch = title.match(/(?:surah|chapter)\s*(\d{1,3})/i)
  const surahNumber = numberMatch ? parseInt(numberMatch[1]) : null

  // Pattern to match surah names
  const nameMatch = title.match(/(?:surah|chapter)\s*(?:(\d{1,3})\s*)?([a-zA-Z\s]+?)(?:\s*-\s*|$)/i)
  const surahName = nameMatch && nameMatch[2] ? nameMatch[2].trim() : null

  return {
    number: surahNumber,
    name: surahName,
  }
}

/**
 * Check if a title appears to be a Quran recitation
 * @param {string} title - Video title
 * @returns {boolean} True if it appears to be a Quran recitation
 */
export const isQuranRecitation = (title) => {
  if (!title) return false

  const keywords = [
    'quran', 'koran', 'qur\'an', 'qur\'ān',
    'surah', 'sura', 'chapter',
    'recitation', 'recite', 'tilawah',
    'mishary', 'sudais', 'shuraim', 'maher', 'hudhaify',
    'sheikh', 'imam', 'qari',
  ]

  const lowerTitle = title.toLowerCase()
  return keywords.some(keyword => lowerTitle.includes(keyword))
}

/**
 * Build search query for YouTube
 * @param {string} surahName - Name of the surah
 * @param {string} reciterName - Name of the reciter
 * @returns {string} Formatted search query
 */
export const buildSearchQuery = (surahName, reciterName) => {
  const parts = []

  if (surahName) {
    parts.push(`surah ${surahName}`)
  }

  if (reciterName) {
    parts.push(`recitation by ${reciterName}`)
  }

  if (parts.length === 0) {
    return 'quran recitation'
  }

  return parts.join(' ')
}

/**
 * Get quality label from bitrate
 * @param {number} bitrate - Audio bitrate
 * @returns {string} Quality label
 */
export const getQualityLabel = (bitrate) => {
  if (bitrate >= 320) return '320k'
  if (bitrate >= 192) return '192k'
  if (bitrate >= 128) return '128k'
  return '128k' // Default
}

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL or video ID
 * @returns {string|null} Extracted video ID or null
 */
export const extractVideoId = (url) => {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Clean search text by removing special characters and normalizing
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export const cleanSearchText = (text) => {
  if (!text) return ''

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
