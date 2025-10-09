// Hot search terms for YouTube Quran recitations
// These are curated popular search terms for Quran content

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get popular search terms
  getList(page = 1, limit = 30) {
    console.log('🔥 YouTube hotSearch.getList called:', { page, limit })

    // Curated list of popular Quran search terms
    const hotSearchTerms = [
      {
        keyword: 'mishary rashid',
        count: 1000,
        rank: 1,
      },
      {
        keyword: 'sudais quran',
        count: 950,
        rank: 2,
      },
      {
        keyword: 'maher al mueaqly',
        count: 900,
        rank: 3,
      },
      {
        keyword: 'saad al ghamdi',
        count: 850,
        rank: 4,
      },
      {
        keyword: 'surah al fatiha',
        count: 800,
        rank: 5,
      },
      {
        keyword: 'surah al baqarah',
        count: 750,
        rank: 6,
      },
      {
        keyword: 'surah yasin',
        count: 700,
        rank: 7,
      },
      {
        keyword: 'surah ar rahman',
        count: 650,
        rank: 8,
      },
      {
        keyword: 'surah al mulk',
        count: 600,
        rank: 9,
      },
      {
        keyword: 'surah al kahf',
        count: 550,
        rank: 10,
      },
      {
        keyword: 'shuraim quran',
        count: 500,
        rank: 11,
      },
      {
        keyword: 'hudhaify recitation',
        count: 450,
        rank: 12,
      },
      {
        keyword: 'surah al waqiah',
        count: 400,
        rank: 13,
      },
      {
        keyword: 'surah al buruj',
        count: 350,
        rank: 14,
      },
      {
        keyword: 'surah al buruj',
        count: 300,
        rank: 15,
      },
      {
        keyword: 'surah al buruj',
        count: 250,
        rank: 16,
      },
      {
        keyword: 'surah al buruj',
        count: 200,
        rank: 17,
      },
      {
        keyword: 'surah al buruj',
        count: 150,
        rank: 18,
      },
      {
        keyword: 'surah al buruj',
        count: 100,
        rank: 19,
      },
      {
        keyword: 'surah al buruj',
        count: 50,
        rank: 20,
      },
    ]

    return Promise.resolve({ list: hotSearchTerms })
  },

  // Search hot terms
  search(str, page = 1, limit, retryNum = 0) {
    console.log('🔥 YouTube hotSearch.search called:', { str, page, limit })

    return this.getList(page, limit).then(searchTerms => {
      let filteredTerms = searchTerms

      // Filter by search term if provided
      if (str && str.trim()) {
        const searchTerm = str.toLowerCase().trim()
        filteredTerms = searchTerms.filter(term =>
          term.keyword.toLowerCase().includes(searchTerm),
        )
      }

      // Transform to music SDK format
      const list = filteredTerms.map(term => ({
        name: term.keyword,
        singer: 'Popular Search',
        source: 'youtube',
        songmid: `yt_hot_${term.rank}`,
        albumId: 'yt_hot_search',
        interval: '0:00:00',
        albumName: 'Hot Search Terms',
        img: '',
        lrc: '',
        lrcUrl: '',
        otherSource: [],
        types: [],
        _types: [],
        meta: {
          youtubeId: `hot_${term.rank}`,
          youtubeType: 'search_term',
          youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(term.keyword)}`,
          searchCount: term.count,
          rank: term.rank,
        },
      }))

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedList = list.slice(startIndex, endIndex)

      return {
        list: paginatedList,
        allPage: Math.ceil(list.length / limit),
        limit: this.limit,
        total: list.length,
        source: 'youtube',
      }
    })
  },
}
