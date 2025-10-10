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
  const surahNumber = numberMatch ? parseInt(numberMatch[1], 10) : null

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

  // Handle new API format where title might be an object
  const titleText = typeof title === 'string' ? title : (title.text || title.title || '')
  if (!titleText) return false

  const keywords = [
    'quran', 'koran', 'qur\'an', 'qur\'ān',
    'surah', 'sura', 'chapter',
    'recitation', 'recite', 'tilawah',
    'mishary', 'sudais', 'shuraim', 'maher', 'hudhaify',
    'sheikh', 'imam', 'qari',
  ]

  const lowerTitle = titleText.toLowerCase()
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

/**
 * NEW FUNCTION TO FIX DATE ERRORS
 * Parses YouTube's human-readable date strings (e.g., "2 weeks ago", "1 year ago").
 * @param {string | null | undefined} dateString - The date string to parse.
 * @returns {string | null} - The date in ISO 8601 format, or the original string if parsing fails.
 */
export const parseReadableDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null
  }

  const now = new Date()
  const lowerCaseDateString = dateString.toLowerCase()

  // Match expressions like "5 hours ago", "1 day ago", "2 weeks ago", etc.
  const timeAgoMatch = lowerCaseDateString.match(/(\d+)\s+(hour|day|week|month|year)s?\s+ago/)

  if (timeAgoMatch) {
    const value = parseInt(timeAgoMatch[1], 10)
    const unit = timeAgoMatch[2]

    switch (unit) {
      case 'hour':
        now.setHours(now.getHours() - value)
        break
      case 'day':
        now.setDate(now.getDate() - value)
        break
      case 'week':
        now.setDate(now.getDate() - value * 7)
        break
      case 'month':
        now.setMonth(now.getMonth() - value)
        break
      case 'year':
        now.setFullYear(now.getFullYear() - value)
        break
      default:
        // If unit is not recognized, return the current date
        return now.toISOString()
    }
    return now.toISOString()
  }

  // Fallback for other potential date formats (e.g., "Premiered Jan 5, 2024")
  try {
    const parsedDate = new Date(dateString)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString()
    }
  } catch (e) {
    // Ignore parsing errors and return the original string
  }

  // If no match and not a valid date string, return the original as a fallback
  return dateString
}
