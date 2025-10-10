// Quran doesn't have traditional leaderboards, but we can show popular reciters
import { httpFetch } from '../../request'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get popular/famous reciters (acts as a leaderboard)
  getPopularReciters(locale = 'en') {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters?locale=${locale}&fields=profile_picture,cover_image,bio`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.reciters) {
        return Promise.reject(new Error('Failed to fetch reciters'))
      }

      // Sort reciters by popularity (we can define our own criteria)
      // For now, we'll use a predefined list of popular reciters
      const popularReciterIds = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16] // Popular reciter IDs
      const popularReciters = body.reciters.filter(reciter =>
        popularReciterIds.includes(reciter.id),
      )

      return popularReciters
    })
  },

  handleResult(reciters) {
    if (!reciters) return []

    return reciters.map((reciter, index) => ({
      name: reciter.translatedName?.name || reciter.name,
      singer: reciter.name,
      source: 'quran',
      songmid: `reciter_${reciter.id}`,
      albumId: `reciter_${reciter.id}`,
      interval: '0:00',
      albumName: `${reciter.style?.name || 'Recitation'} - ${reciter.qirat?.name || 'Hafs'}`,
      img: reciter.profilePicture || reciter.coverImage,
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' },
      ],
      _types: {
        mp3: { size: '0MB' },
      },
      typeUrl: {},
      // Quran-specific data
      reciterId: reciter.id,
      reciterName: reciter.name,
      reciterPic: reciter.profilePicture,
      recitationStyle: reciter.recitationStyle,
      qirat: reciter.qirat?.name,
      style: reciter.style?.name,
      bio: reciter.bio,
      relativePath: reciter.relativePath,
      isReciter: true,
      rank: index + 1, // Add ranking
    }))
  },

  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    return this.getPopularReciters().then(reciters => {
      // Filter reciters based on search string
      let filteredReciters = reciters
      if (str && str.trim()) {
        const searchTerm = str.toLowerCase().trim()
        filteredReciters = reciters.filter(reciter =>
          (reciter.name && reciter.name.toLowerCase().includes(searchTerm)) ||
          (reciter.translatedName?.name && reciter.translatedName.name.toLowerCase().includes(searchTerm)) ||
          (reciter.style?.name && reciter.style.name.toLowerCase().includes(searchTerm)) ||
          (reciter.qirat?.name && reciter.qirat.name.toLowerCase().includes(searchTerm)),
        )
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedReciters = filteredReciters.slice(startIndex, endIndex)

      const list = this.handleResult(paginatedReciters)

      this.total = filteredReciters.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'quran',
      }
    })
  },

  // Add missing methods required by the interface
  getBoards() {
    return Promise.resolve({
      list: [
        { id: 'quran__popular_reciters', name: 'Popular Reciters', bangid: 'popular_reciters' },
        { id: 'quran__famous_reciters', name: 'Famous Reciters', bangid: 'famous_reciters' },
        { id: 'quran__trending_reciters', name: 'Trending Reciters', bangid: 'trending_reciters' },
      ],
    })
  },

  getList() {
    return this.search('', 1, this.limit)
  },
}
