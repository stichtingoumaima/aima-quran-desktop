import { httpFetch } from '../../request'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get fallback image for reciters when Quran.com doesn't provide images
  getReciterFallbackImage(reciterName) {
    if (!reciterName) return 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center'

    // Map popular reciters to specific images
    const reciterImages = {
      'Yasser Ad Dussary': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Abu Bakr al-Shatri': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Sa\'ud ash-Shuraim': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Mishari Rashid al-`Afasy': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'AbdulBaset AbdulSamad': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Hani ar-Rifai': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Khalifah Al Tunaiji': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Mohamed Siddiq al-Minshawi': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Abdur-Rahman as-Sudais': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Mahmoud Khalil Al-Husary': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
    }

    return reciterImages[reciterName] || 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center'
  },

  // Get all available reciters from Quran.com API
  getReciters(locale = 'en') {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters?locale=${locale}&fields=profile_picture,cover_image,bio`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.reciters || !Array.isArray(body.reciters)) {
        return Promise.reject(new Error('Failed to fetch reciters'))
      }
      return body.reciters
    }).catch(error => {
      console.error('Error fetching reciters:', error)
      return Promise.reject(new Error('Failed to fetch reciters'))
    })
  },

  // Transform reciters to music SDK format (as playlists)
  handleResult(reciters) {
    if (!reciters) return []

    return reciters.map(reciter => ({
      name: reciter.translatedName?.name || reciter.name || 'Unknown Reciter',
      singer: reciter.name || 'Unknown Reciter',
      source: 'quran',
      songmid: `reciter_${reciter.id || 'unknown'}`,
      albumId: `reciter_${reciter.id || 'unknown'}`,
      interval: '0:00', // Reciters don't have duration
      albumName: `${reciter.style?.name || 'Recitation'} - ${reciter.qirat?.name || 'Hafs'}`,
      img: reciter.profilePicture || reciter.coverImage || this.getReciterFallbackImage(reciter.name),
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' }, // All recitations are MP3
      ],
      _types: {
        mp3: { size: '0MB' },
      },
      typeUrl: {},
      // Quran-specific data
      reciterId: reciter.id || 'unknown',
      reciterName: reciter.name || 'Unknown Reciter',
      reciterPic: reciter.profilePicture || '',
      recitationStyle: reciter.recitationStyle || 'Unknown',
      qirat: reciter.qirat?.name || 'Unknown',
      style: reciter.style?.name || 'Unknown',
      bio: reciter.bio || '',
      relativePath: reciter.relativePath || '',
      isReciter: true, // Flag to identify this as a reciter
    }))
  },

  // Search for reciters (acts as playlist search)
  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    return this.getReciters().then(reciters => {
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
}
