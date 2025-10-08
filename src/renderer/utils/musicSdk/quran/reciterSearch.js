import { httpFetch } from '../../request'
import { formatReciter } from './util'

const reciterSearch = {
  // Search for reciters (filter client-side since API doesn't support search)
  search(query, page = 1, limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/resources/recitations').promise.then(({ body }) => {
      if (!body.recitations) {
        return {
          list: [],
          total: 0,
          page,
          limit,
        }
      }

      // Filter reciters client-side based on query
      let filteredReciters = body.recitations
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim()
        filteredReciters = body.recitations.filter(reciter =>
          reciter.reciter_name.toLowerCase().includes(searchTerm) ||
          (reciter.translated_name && reciter.translated_name.name &&
           reciter.translated_name.name.toLowerCase().includes(searchTerm)),
        )
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const paginatedReciters = filteredReciters.slice(startIndex, startIndex + limit)

      return {
        list: paginatedReciters.map(reciter => formatReciter(reciter)),
        total: filteredReciters.length,
        page,
        limit,
      }
    }).catch(error => {
      console.error('Reciter search error:', error)
      return {
        list: [],
        total: 0,
        page,
        limit,
      }
    })
  },

  // Get popular reciters (just get all reciters since API doesn't support popular filter)
  getPopular(limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/resources/recitations').promise.then(({ body }) => {
      if (!body.recitations) {
        return {
          list: [],
          total: 0,
        }
      }

      // Limit the results
      const limitedReciters = body.recitations.slice(0, limit)

      const result = {
        list: limitedReciters.map(reciter => formatReciter(reciter)),
        total: limitedReciters.length,
      }
      return result
    }).catch(error => {
      console.error('Popular reciters error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },

  // Get reciters by language (filter client-side)
  getByLanguage(language, limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/resources/recitations').promise.then(({ body }) => {
      if (!body.recitations) {
        return {
          list: [],
          total: 0,
        }
      }

      // Filter by language client-side
      const filteredReciters = body.recitations.filter(reciter =>
        reciter.translated_name &&
        reciter.translated_name.language_name &&
        reciter.translated_name.language_name.toLowerCase().includes(language.toLowerCase()),
      ).slice(0, limit)

      return {
        list: filteredReciters.map(reciter => formatReciter(reciter)),
        total: filteredReciters.length,
      }
    }).catch(error => {
      console.error('Reciters by language error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },

  // Get reciters by style (filter client-side)
  getByStyle(style, limit = 20) {
    return httpFetch('https://api.quran.com/api/v4/resources/recitations').promise.then(({ body }) => {
      if (!body.recitations) {
        return {
          list: [],
          total: 0,
        }
      }

      // Filter by style client-side
      const filteredReciters = body.recitations.filter(reciter =>
        reciter.style &&
        reciter.style.toLowerCase().includes(style.toLowerCase()),
      ).slice(0, limit)

      return {
        list: filteredReciters.map(reciter => formatReciter(reciter)),
        total: filteredReciters.length,
      }
    }).catch(error => {
      console.error('Reciters by style error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },

}

export default reciterSearch
