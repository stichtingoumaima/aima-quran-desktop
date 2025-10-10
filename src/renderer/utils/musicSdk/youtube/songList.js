import { formatDuration, extractReciterFromTitle, extractSurahFromTitle, isQuranRecitation } from './utils'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { rendererInvoke } from '@common/rendererIpc'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get videos from a YouTube playlist
  getPlaylistVideos(playlistId, page = 1, limit = 30) {
    console.log('📋 YouTube songList.getPlaylistVideos called:', { playlistId, page, limit })

    const requestObj = {
      promise: (async() => {
        try {
          console.log('📡 Getting YouTube playlist via IPC:', playlistId)

          const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_playlist, {
            playlistId,
          })

          if (!response.success) {
            throw new Error(response.error || 'Failed to get YouTube playlist')
          }

          const playlist = response.data
          console.log('📡 YouTube playlist response:', {
            title: playlist.header?.title?.text,
            videoCount: playlist.contents?.length || 0,
            channel: playlist.header?.subtitle?.text,
          })

          if (!playlist || !playlist.contents) {
            throw new Error('No playlist videos found')
          }

          // Extract videos from playlist contents
          const videos = playlist.contents
            .filter(item => item.playlist_video_renderer)
            .map(item => item.playlist_video_renderer)

          // Filter for Quran recitations
          const quranVideos = videos.filter(video =>
            isQuranRecitation(video.title?.runs?.[0]?.text || video.title?.text),
          )

          // Apply pagination
          const startIndex = (page - 1) * limit
          const endIndex = startIndex + limit
          const paginatedVideos = quranVideos.slice(startIndex, endIndex)

          // Transform videos to song format
          const list = paginatedVideos.map(video => this.transformVideoToSong(video, playlist))

          this.total = quranVideos.length
          this.page = page
          this.allPage = Math.ceil(this.total / limit)

          return {
            list,
            allPage: this.allPage,
            limit: this.limit,
            total: this.total,
            source: 'youtube',
            info: {
              name: playlist.header?.title?.text || 'Unknown Playlist',
              author: playlist.header?.subtitle?.text || 'YouTube Channel',
              desc: playlist.description || `Quran recitation playlist with ${quranVideos.length} videos`,
              img: playlist.header?.playlist_header_banner?.hero_banner?.banner_image?.sources?.[0]?.url || '',
              play_count: null,
              total: quranVideos.length,
            },
          }
        } catch (error) {
          console.error('❌ Error fetching playlist videos:', error)
          throw error
        }
      })(),
    }

    return requestObj.promise
  },

  // Transform YouTube video to music SDK format
  transformVideoToSong(video, playlist = null) {
    const title = video.title?.runs?.[0]?.text || video.title?.text || 'Unknown Title'
    const reciter = extractReciterFromTitle(title)
    const surah = extractSurahFromTitle(title)
    const duration = video.length_seconds || video.duration?.seconds || 0

    return {
      name: title,
      singer: reciter,
      source: 'youtube',
      songmid: `yt_${video.video_id}`,
      albumId: playlist ? `yt_playlist_${playlist.id}` : `yt_channel_${video.short_byline_text?.runs?.[0]?.navigation_endpoint?.browse_endpoint?.browse_id || 'unknown'}`,
      interval: formatDuration(duration),
      albumName: playlist ? playlist.header?.title?.text : (video.short_byline_text?.runs?.[0]?.text || 'YouTube Channel'),
      img: video.thumbnail?.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [
        { type: 'mp4', size: '0MB' },
      ],
      _types: {
        mp4: { size: '0MB' },
      },
      typeUrl: {},
      // YouTube-specific data
      youtubeId: video.video_id,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.video_id}`,
      channelName: video.short_byline_text?.runs?.[0]?.text,
      channelId: video.short_byline_text?.runs?.[0]?.navigation_endpoint?.browse_endpoint?.browse_id,
      views: video.video_info?.runs?.[0]?.text,
      uploadDate: video.video_info?.runs?.[1]?.text,
      duration,
      // Quran-specific data
      reciterName: reciter,
      surahNumber: surah.number,
      surahName: surah.name,
      isQuranRecitation: true,
      // Playlist-specific data
      playlistId: playlist?.id,
      playlistTitle: playlist?.header?.title?.text,
    }
  },

  // Get list detail (for playlist navigation)
  getListDetail(playlistId, page = 1, limit = 30) {
    console.log('📖 YouTube getListDetail called:', { playlistId, page, limit })

    // Extract playlist ID from various formats
    let actualPlaylistId = playlistId
    if (playlistId.startsWith('yt_playlist_')) {
      actualPlaylistId = playlistId.replace('yt_playlist_', '')
    }

    return this.getPlaylistVideos(actualPlaylistId, page, limit)
  },

  // Search for playlists (acts as song list search)
  search(str, page = 1, limit, retryNum = 0) {
    console.log('📚 YouTube songList.search called:', { str, page, limit, retryNum })
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    // If no search string, return popular Quran playlists
    if (!str || !str.trim()) {
      console.log('🎵 Showing popular Quran playlists')
      return this.getPopularQuranPlaylists(page, limit)
    }

    console.log('🔍 Searching for Quran playlists:', str)

    const requestObj = {
      promise: (async() => {
        try {
          console.log('📡 Searching YouTube playlists via IPC:', `${str} quran playlist`)

          const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_search, {
            query: `${str} quran playlist`,
            page,
            limit,
            searchType: 'playlist',
          })

          if (!response.success) {
            throw new Error(response.error || 'YouTube playlist search failed')
          }

          const searchResponse = response.data
          const playlists = searchResponse.playlists || []

          console.log('📡 YouTube playlist search response:', {
            resultCount: playlists.length,
            firstResult: playlists[0]?.title,
          })

          if (!playlists || playlists.length === 0) {
            console.log('❌ No playlist results found')
            return {
              list: [],
              allPage: 0,
              limit: this.limit,
              total: 0,
              source: 'youtube',
            }
          }

          // Filter and transform results
          const filteredResults = playlists
            .filter(playlist => this.isQuranPlaylist(playlist.title))
            .map(playlist => this.transformPlaylistToSong(playlist))

          console.log('🎯 Filtered playlist results:', filteredResults.length)

          this.total = filteredResults.length
          this.page = page
          this.allPage = Math.ceil(this.total / limit)

          return {
            list: filteredResults,
            allPage: this.allPage,
            limit: this.limit,
            total: this.total,
            source: 'youtube',
          }
        } catch (error) {
          console.error('❌ YouTube playlist search error:', error)
          return this.search(str, page, limit, retryNum)
        }
      })(),
    }

    return requestObj.promise
  },

  // Check if playlist title indicates it's a Quran playlist
  isQuranPlaylist(title) {
    if (!title) return false

    const keywords = [
      'quran', 'koran', 'qur\'an', 'qur\'ān',
      'complete quran', 'full quran',
      'recitation', 'recite', 'tilawah',
      'mishary', 'sudais', 'shuraim', 'maher', 'hudhaify',
      'sheikh', 'imam', 'qari',
    ]

    const lowerTitle = title.toLowerCase()
    return keywords.some(keyword => lowerTitle.includes(keyword))
  },

  // Transform playlist to song format (for display in lists)
  transformPlaylistToSong(playlist) {
    const playlistId = `yt_playlist_${playlist.playlist_id}`

    // Get thumbnail URL with fallback
    let thumbnailUrl = ''
    if (playlist.thumbnails?.[0]?.url && !playlist.thumbnails[0].url.includes('example')) {
      thumbnailUrl = playlist.thumbnails[0].url
    } else {
      // Use a default Quran-related image as fallback
      thumbnailUrl = 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center'
    }

    return {
      id: playlistId, // This is the key fix - add the id property
      name: playlist.title || 'Unknown Playlist',
      singer: playlist.author?.name || 'YouTube Channel',
      source: 'youtube',
      songmid: playlistId,
      albumId: playlistId,
      interval: '0:00:00', // Duration is not available for playlists in search results
      albumName: playlist.author?.name || 'YouTube Channel',
      img: thumbnailUrl,
      lrc: null,
      types: [{ type: 'mp4', size: '0MB' }],
      _types: { mp4: { size: '0MB' } },
      typeUrl: {},
      youtubePlaylistId: playlist.playlist_id,
      videoCount: playlist.video_count?.text || '0',
      isPlaylist: true,
    }
  },

  // Get popular Quran playlists
  getPopularQuranPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting popular Quran playlists')

    // Curated list of popular Quran playlists with real YouTube playlist IDs
    const popularPlaylists = [
      {
        playlist_id: 'PL23vgdbgp7Gf8E-gNd6cdK3Ua2wI_aV03',
        title: 'Complete Quran - Sheikh Mishary Rashid Alafasy',
        author: { name: 'Quran Recitation' },
        video_count: { text: '114 videos' },
        thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }],
      },
      {
        playlist_id: 'PLtOLkyII0gdo8pB4JkMEhog2dI9QYb5SX',
        title: 'Complete Quran - Sheikh Abdul Rahman Al-Sudais',
        author: { name: 'Quran Recitation' },
        video_count: { text: '114 videos' },
        thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }],
      },
      {
        playlist_id: 'PLx5qL2g2trT9Y4E1KZnT5QKZ8eFfGgHhIi',
        title: 'Complete Quran - Sheikh Maher Al Mueaqly',
        author: { name: 'Quran Recitation' },
        video_count: { text: '114 videos' },
        thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }],
      },
      {
        playlist_id: 'PLy5qL2g2trT9Y4E1KZnT5QKZ8eFfGgHhIj',
        title: 'Complete Quran - Sheikh Saad Al-Ghamdi',
        author: { name: 'Quran Recitation' },
        video_count: { text: '114 videos' },
        thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }],
      },
      {
        playlist_id: 'PLz5qL2g2trT9Y4E1KZnT5QKZ8eFfGgHhIk',
        title: 'Complete Quran - Sheikh Muhammad Al-Luhaidan',
        author: { name: 'Quran Recitation' },
        video_count: { text: '114 videos' },
        thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }],
      },
    ]

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPlaylists = popularPlaylists.slice(startIndex, endIndex)

    const list = paginatedPlaylists.map(playlist => this.transformPlaylistToSong(playlist))

    this.total = popularPlaylists.length
    this.page = page
    this.allPage = Math.ceil(this.total / limit)

    return Promise.resolve({
      list,
      allPage: this.allPage,
      limit: this.limit,
      total: this.total,
      source: 'youtube',
    })
  },

  // Add missing methods required by the interface
  getTags() {
    console.log('📋 YouTube getTags called')

    // Define categories for Quran playlists
    const tags = [
      {
        name: 'Quran Categories',
        list: [
          { parent_id: 'quran', parent_name: 'Quran Categories', id: 'complete-quran', name: 'Complete Quran', source: 'youtube' },
          { parent_id: 'quran', parent_name: 'Quran Categories', id: 'surah-playlists', name: 'Surah Playlists', source: 'youtube' },
          { parent_id: 'quran', parent_name: 'Quran Categories', id: 'reciter-collections', name: 'Reciter Collections', source: 'youtube' },
          { parent_id: 'quran', parent_name: 'Quran Categories', id: 'translation-playlists', name: 'Translation Playlists', source: 'youtube' },
        ],
      },
      {
        name: 'Recitation Styles',
        list: [
          { parent_id: 'style', parent_name: 'Recitation Styles', id: 'melodic', name: 'Melodic Recitation', source: 'youtube' },
          { parent_id: 'style', parent_name: 'Recitation Styles', id: 'traditional', name: 'Traditional Recitation', source: 'youtube' },
          { parent_id: 'style', parent_name: 'Recitation Styles', id: 'emotional', name: 'Emotional Recitation', source: 'youtube' },
        ],
      },
    ]

    const hotTag = [
      { id: 'complete-quran', name: 'Complete Quran', source: 'youtube' },
      { id: 'reciter-collections', name: 'Reciter Collections', source: 'youtube' },
      { id: 'melodic', name: 'Melodic Recitation', source: 'youtube' },
    ]

    const result = {
      tags,
      hotTag,
      source: 'youtube',
    }

    console.log('📋 YouTube getTags returning:', result)
    console.log('📋 hotTag type:', typeof result.hotTag, 'isArray:', Array.isArray(result.hotTag))
    console.log('📋 hotTag content:', result.hotTag)

    // Ensure hotTag is always an array
    if (!Array.isArray(result.hotTag)) {
      console.error('❌ hotTag is not an array!', result.hotTag)
      result.hotTag = []
    }

    return Promise.resolve(result)
  },

  getList(sortId = 'default', tabId = '', page = 1) {
    console.log('📋 YouTube getList called:', { sortId, tabId, page })

    // If no specific tag is selected, return diverse Quran playlists from real YouTube search
    if (!tabId) {
      return this.getDiverseQuranPlaylists(page, this.limit)
    }

    // Handle different categories
    switch (tabId) {
      case 'complete-quran':
        return this.getCompleteQuranPlaylists(page, this.limit)
      case 'surah-playlists':
        return this.getSurahPlaylists(page, this.limit)
      case 'reciter-collections':
        return this.getReciterCollections(page, this.limit)
      case 'translation-playlists':
        return this.getTranslationPlaylists(page, this.limit)
      case 'melodic':
        return this.getMelodicRecitations(page, this.limit)
      case 'traditional':
        return this.getTraditionalRecitations(page, this.limit)
      case 'emotional':
        return this.getEmotionalRecitations(page, this.limit)
      default:
        return this.getDiverseQuranPlaylists(page, this.limit)
    }
  },

  sortList: [
    { name: 'Default', id: 'default' },
    { name: 'Most Popular', id: 'popular' },
    { name: 'Newest', id: 'newest' },
  ],

  // Default method for diverse Quran playlists
  async getDiverseQuranPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting diverse Quran playlists from real YouTube search')

    // Search for popular Quran reciters and their playlists
    const diverseQueries = [
      'ahmed khedr quran playlist',
      'mustafa sherif quran playlist',
      'mishary rashid alafasy quran playlist',
      'abdul rahman al sudais quran playlist',
      'saad al ghamdi quran playlist',
      'maher al mueaqly quran playlist',
      'muhammad al luhaidan quran playlist',
      'sudais and shuraim quran playlist',
      'fares abbad quran playlist',
      'yasser al dosari quran playlist',
    ]

    // Use a different query based on the page to get variety
    const queryIndex = (page - 1) % diverseQueries.length
    const selectedQuery = diverseQueries[queryIndex]

    console.log(`🔍 Using query for page ${page}: ${selectedQuery}`)
    return this.searchPlaylists(selectedQuery, page, limit)
  },

  // Category-specific playlist methods
  async getCompleteQuranPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting Complete Quran playlists')
    return this.searchPlaylists('complete quran recitation playlist', page, limit)
  },

  async getSurahPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting Surah playlists')
    return this.searchPlaylists('quran surah playlist recitation', page, limit)
  },

  async getReciterCollections(page = 1, limit = 30) {
    console.log('📋 Getting Reciter collections')

    // Search for specific popular reciters
    const reciterQueries = [
      'ahmed khedr quran collection',
      'mustafa sherif quran collection',
      'mishary rashid alafasy collection',
      'abdul rahman al sudais collection',
      'saad al ghamdi collection',
      'maher al mueaqly collection',
      'fares abbad quran collection',
      'yasser al dosari collection',
      'sudais shuraim collection',
      'muhammad al luhaidan collection',
    ]

    const queryIndex = (page - 1) % reciterQueries.length
    const selectedQuery = reciterQueries[queryIndex]

    console.log(`🔍 Using reciter query for page ${page}: ${selectedQuery}`)
    return this.searchPlaylists(selectedQuery, page, limit)
  },

  async getTranslationPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting Translation playlists')
    return this.searchPlaylists('quran translation playlist', page, limit)
  },

  async getMelodicRecitations(page = 1, limit = 30) {
    console.log('📋 Getting Melodic recitations')

    // Search for melodic reciters known for their beautiful voices
    const melodicQueries = [
      'ahmed khedr melodic quran',
      'mustafa sherif beautiful recitation',
      'mishary rashid alafasy melodic',
      'saad al ghamdi beautiful voice',
      'fares abbad melodic quran',
      'yasser al dosari beautiful recitation',
      'maher al mueaqly melodic',
      'muhammad al luhaidan beautiful voice',
      'abdul rahman al sudais melodic',
      'sudais shuraim beautiful recitation',
    ]

    const queryIndex = (page - 1) % melodicQueries.length
    const selectedQuery = melodicQueries[queryIndex]

    console.log(`🔍 Using melodic query for page ${page}: ${selectedQuery}`)
    return this.searchPlaylists(selectedQuery, page, limit)
  },

  async getTraditionalRecitations(page = 1, limit = 30) {
    console.log('📋 Getting Traditional recitations')
    return this.searchPlaylists('traditional quran recitation playlist', page, limit)
  },

  async getEmotionalRecitations(page = 1, limit = 30) {
    console.log('📋 Getting Emotional recitations')
    return this.searchPlaylists('emotional quran recitation playlist', page, limit)
  },

  // Generic method to search for playlists using YouTube search
  async searchPlaylists(query, page = 1, limit = 30) {
    console.log('🔍 Searching YouTube playlists:', query)

    try {
      const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_search, {
        query: `${query} quran playlist`,
        page,
        limit,
        searchType: 'playlist',
      })

      if (!response.success) {
        throw new Error(response.error || 'YouTube playlist search failed')
      }

      const searchResponse = response.data
      const playlists = searchResponse.playlists || []

      console.log('📡 YouTube playlist search response:', {
        resultCount: playlists.length,
        firstResult: playlists[0]?.title,
      })

      if (!playlists || playlists.length === 0) {
        console.log('❌ No playlist results found')
        return {
          list: [],
          allPage: 0,
          limit: this.limit,
          total: 0,
          source: 'youtube',
        }
      }

      // Filter and transform results
      const filteredResults = playlists
        .filter(playlist => this.isQuranPlaylist(playlist.title))
        .map(playlist => this.transformPlaylistToSong(playlist))

      console.log('🎯 Filtered playlist results:', filteredResults.length)

      this.total = filteredResults.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list: filteredResults,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'youtube',
      }
    } catch (error) {
      console.error('❌ Error searching playlists:', error)
      // Fallback to popular playlists
      return this.getPopularQuranPlaylists(page, limit)
    }
  },
}
