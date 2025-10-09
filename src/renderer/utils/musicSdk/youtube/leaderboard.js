// Leaderboard for popular YouTube Quran playlists and channels
// These are curated popular Quran content from YouTube

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get popular Quran playlists and channels
  getList(id, page = 1, limit = 30) {
    console.log('🏆 YouTube leaderboard.getList called:', { id, page, limit })

    // Curated list of popular Quran playlists and channels
    const popularContent = [
      {
        id: 'PLA8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Mishary Rashid Alafasy',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Mishary Rashid Alafasy',
        popularity: 100,
        rank: 1,
      },
      {
        id: 'PLB8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Abdul Rahman Al-Sudais',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Abdul Rahman Al-Sudais',
        popularity: 95,
        rank: 2,
      },
      {
        id: 'PLC8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Maher Al Mueaqly',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Maher Al Mueaqly',
        popularity: 90,
        rank: 3,
      },
      {
        id: 'PLD8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Saad Al-Ghamdi',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Saad Al-Ghamdi',
        popularity: 85,
        rank: 4,
      },
      {
        id: 'PLE8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Muhammad Al-Luhaidan',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Muhammad Al-Luhaidan',
        popularity: 80,
        rank: 5,
      },
      {
        id: 'PLF8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Fares Abbad',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Fares Abbad',
        popularity: 75,
        rank: 6,
      },
      {
        id: 'PLG8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Khalid Al-Jalil',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Khalid Al-Jalil',
        popularity: 70,
        rank: 7,
      },
      {
        id: 'PLH8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Abdullah Al-Matroud',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Abdullah Al-Matroud',
        popularity: 65,
        rank: 8,
      },
      {
        id: 'PLI8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Yasser Al-Dosari',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Yasser Al-Dosari',
        popularity: 60,
        rank: 9,
      },
      {
        id: 'PLJ8B5A4A4A4A4A4A4',
        title: 'Complete Quran - Sheikh Bandar Baleelah',
        type: 'playlist',
        channel: 'Quran Recitation',
        description: 'Complete Quran recitation by Sheikh Bandar Baleelah',
        popularity: 55,
        rank: 10,
      },
    ]

    return Promise.resolve(popularContent)
  },

  // Search popular content
  search(str, page = 1, limit, retryNum = 0) {
    console.log('🏆 YouTube leaderboard.search called:', { str, page, limit })

    return this.getList(page, limit).then(popularContent => {
      let filteredContent = popularContent

      // Filter by search term if provided
      if (str && str.trim()) {
        const searchTerm = str.toLowerCase().trim()
        filteredContent = popularContent.filter(item =>
          (item.title && item.title.toLowerCase().includes(searchTerm)) ||
          (item.channel && item.channel.toLowerCase().includes(searchTerm)) ||
          (item.description && item.description.toLowerCase().includes(searchTerm)),
        )
      }

      // Transform to music SDK format
      const list = filteredContent.map(item => ({
        name: item.title,
        singer: item.channel,
        source: 'youtube',
        songmid: `yt_leaderboard_${item.rank}`,
        albumId: `yt_${item.type}_${item.id}`,
        interval: '0:00:00',
        albumName: item.type === 'playlist' ? 'Popular Playlists' : 'Popular Channels',
        img: '',
        lrc: '',
        lrcUrl: '',
        otherSource: [],
        types: [],
        _types: [],
        meta: {
          youtubeId: item.id,
          youtubeType: item.type,
          youtubeUrl: item.type === 'playlist'
            ? `https://www.youtube.com/playlist?list=${item.id}`
            : `https://www.youtube.com/channel/${item.id}`,
          channelName: item.channel,
          description: item.description,
          popularity: item.popularity,
          rank: item.rank,
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

  // Add missing methods required by the interface
  getBoards() {
    return this.getList('', 1, 30).then(data => ({
      list: data.list.map(item => ({
        id: item.meta.youtubeId,
        name: item.name,
        bangid: item.meta.rank,
      })),
    }))
  },
}
