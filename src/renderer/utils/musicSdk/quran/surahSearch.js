import { httpFetch } from '../../request'
import { formatSurah } from './util'

const surahSearch = {
  // Search for surahs (filter client-side since API doesn't support search)
  search(query, page = 1, limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/api/v4/chapters').promise.then(({ body }) => {
      if (!body.chapters) {
        return {
          list: [],
          total: 0,
          page,
          limit,
        }
      }

      // Filter surahs client-side based on query
      let filteredSurahs = body.chapters
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim()
        filteredSurahs = body.chapters.filter(surah =>
          surah.name_simple.toLowerCase().includes(searchTerm) ||
          surah.name_arabic.toLowerCase().includes(searchTerm) ||
          (surah.translated_name && surah.translated_name.name &&
           surah.translated_name.name.toLowerCase().includes(searchTerm)),
        )
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const paginatedSurahs = filteredSurahs.slice(startIndex, startIndex + limit)

      return {
        list: paginatedSurahs.map(surah => formatSurah(surah)),
        total: filteredSurahs.length,
        page,
        limit,
      }
    }).catch(error => {
      console.error('Surah search error:', error)
      return {
        list: [],
        total: 0,
        page,
        limit,
      }
    })
  },

  // Get specific surah
  getSurah(surahId) {
    return httpFetch(`https://api.quran.com/api/v4/api/v4/chapters/${surahId}`).promise.then(({ body }) => {
      if (!body.chapter) {
        throw new Error('Surah not found')
      }
      return formatSurah(body.chapter)
    }).catch(error => {
      console.error('Get surah error:', error)
      throw error
    })
  },

  // Get surahs by revelation place (filter client-side)
  getByRevelationPlace(place, limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/api/v4/chapters').promise.then(({ body }) => {
      if (!body.chapters) {
        return {
          list: [],
          total: 0,
        }
      }

      // Filter by revelation place client-side
      const filteredSurahs = body.chapters.filter(surah =>
        surah.revelation_place &&
        surah.revelation_place.toLowerCase().includes(place.toLowerCase()),
      ).slice(0, limit)

      return {
        list: filteredSurahs.map(surah => formatSurah(surah)),
        total: filteredSurahs.length,
      }
    }).catch(error => {
      console.error('Surahs by revelation place error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },

  // Get surahs by verse count range (filter client-side)
  getByVerseCount(minVerses, maxVerses, limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/api/v4/chapters').promise.then(({ body }) => {
      if (!body.chapters) {
        return {
          list: [],
          total: 0,
        }
      }

      // Filter by verse count range client-side
      const filteredSurahs = body.chapters.filter(surah =>
        surah.verses_count >= minVerses && surah.verses_count <= maxVerses,
      ).slice(0, limit)

      return {
        list: filteredSurahs.map(surah => formatSurah(surah)),
        total: filteredSurahs.length,
      }
    }).catch(error => {
      console.error('Surahs by verse count error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },

  // Get all surahs
  getAll(limit = 114) {
    return httpFetch('https://api.quran.com/api/v4/api/v4/chapters').promise.then(({ body }) => {
      if (!body.chapters) {
        return {
          list: [],
          total: 0,
        }
      }

      // Limit the results
      const limitedSurahs = body.chapters.slice(0, limit)

      return {
        list: limitedSurahs.map(surah => formatSurah(surah)),
        total: limitedSurahs.length,
      }
    }).catch(error => {
      console.error('Get all surahs error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },
}

export default surahSearch
