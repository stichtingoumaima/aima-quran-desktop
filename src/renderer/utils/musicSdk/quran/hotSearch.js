// Quran hot search - popular searches related to Quran
export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Popular search terms for Quran
  getHotSearches() {
    const hotSearches = [
      'Al-Fatihah',
      'Al-Baqarah',
      'Ayah Al-Kursi',
      'Al-Ikhlas',
      'Al-Falaq',
      'An-Nas',
      'Al-Mulk',
      'Yasin',
      'Ar-Rahman',
      'Al-Waqiah',
      'Al-Muzzammil',
      'Al-Muddaththir',
      'Al-Qadr',
      'Al-Alaq',
      'Al-Tin',
      'Al-Sharh',
      'Al-Duha',
      'Al-Layl',
      'Al-Fajr',
      'Al-Balad',
    ]

    return Promise.resolve(hotSearches)
  },

  handleResult(hotSearches) {
    if (!hotSearches) return []

    return hotSearches.map((searchTerm, index) => ({
      name: searchTerm,
      singer: 'Quran Search',
      source: 'quran',
      songmid: `search_${index}`,
      albumId: `search_${index}`,
      interval: '0:00',
      albumName: 'Popular Search',
      img: '',
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' },
      ],
      _types: {
        mp3: { size: '0MB' },
      },
      typeUrl: {},
      // Quran-specific data
      isHotSearch: true,
      searchTerm,
      rank: index + 1,
    }))
  },

  search(str, page = 1, limit, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    return this.getHotSearches().then(hotSearches => {
      // Filter hot searches based on search string
      let filteredSearches = hotSearches
      if (str && str.trim()) {
        const searchTerm = str.toLowerCase().trim()
        filteredSearches = hotSearches.filter(search =>
          search && search.toLowerCase().includes(searchTerm),
        )
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedSearches = filteredSearches.slice(startIndex, endIndex)

      const list = this.handleResult(paginatedSearches)

      this.total = filteredSearches.length
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
  getList() {
    return this.search('', 1, this.limit)
  },
}
