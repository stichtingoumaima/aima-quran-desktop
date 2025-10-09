import { formatDuration, extractReciterFromTitle, extractSurahFromTitle, isQuranRecitation, buildSearchQuery, cleanSearchText } from './utils'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { rendererInvoke } from '@common/rendererIpc'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Search YouTube for Quran recitations
  search(str, page = 1, limit, retryNum = 0) {
    console.log('🎵 YouTube musicSearch.search called:', { str, page, limit, retryNum })
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    // If no search string, return popular Quran playlists
    if (!str || !str.trim()) {
      console.log('🕌 No search string - returning popular Quran playlists')
      return this.getPopularQuranPlaylists(page, limit)
    }

    const searchQuery = cleanSearchText(str)
    console.log('🔍 Searching YouTube for:', searchQuery)

    // Build enhanced search query for Quran recitations
    const enhancedQuery = this.buildQuranSearchQuery(searchQuery)
    console.log('🎯 Enhanced search query:', enhancedQuery)

    const requestObj = {
      promise: this.performYouTubeSearch(enhancedQuery, page, limit, retryNum),
    }

    return requestObj.promise
  },

  // Perform YouTube search using main process IPC
  async performYouTubeSearch(enhancedQuery, page, limit, retryNum) {
    try {
      console.log('📡 Calling YouTube search via IPC:', enhancedQuery)

      const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_search, {
        query: enhancedQuery,
        page,
        limit,
      })

      if (!response.success) {
        throw new Error(response.error || 'YouTube search failed')
      }

      const videos = response.data.videos || []

      console.log('📡 YouTube search response:', {
        resultCount: videos.length,
        firstResult: videos[0]?.title,
      })

      if (!videos || videos.length === 0) {
        console.log('❌ No search results found')
        return {
          list: [],
          allPage: 0,
          limit: this.limit,
          total: 0,
          source: 'youtube',
        }
      }

      // Filter and transform results
      const filteredResults = videos
        .filter(video => isQuranRecitation(video.title))
        .map(video => this.transformVideoToSong(video))

      console.log('🎯 Filtered and transformed results:', filteredResults.length)

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
      console.error('❌ YouTube search error:', error)

      // For errors, retry if we haven't exceeded max retries
      if (retryNum < 3) {
        console.log(`🔄 Retrying YouTube search (attempt ${retryNum + 1}/3)`)
        return this.search(enhancedQuery, page, limit, retryNum + 1)
      }

      // If all retries failed, return empty results
      console.log('🚫 YouTube search failed after all retries, returning empty results')
      return {
        list: [],
        allPage: 0,
        limit: this.limit,
        total: 0,
        source: 'youtube',
      }
    }
  },

  // Build enhanced search query for Quran recitations
  buildQuranSearchQuery(query) {
    const cleanQuery = cleanSearchText(query)

    // If query already contains Quran-related terms, use as-is
    if (cleanQuery.includes('quran') || cleanQuery.includes('surah') || cleanQuery.includes('recitation')) {
      return cleanQuery
    }

    // Otherwise, enhance with Quran context
    return `quran recitation ${cleanQuery}`
  },

  // Transform YouTube video to music SDK format
  transformVideoToSong(video) {
    // Handle new API format (v15.1.1)
    const title = video.title?.text || video.title || 'Unknown Title'
    const reciter = extractReciterFromTitle(title)
    const surah = extractSurahFromTitle(title)

    // Parse duration from length_text or duration
    let duration = 0
    if (video.length_text?.text) {
      // Parse duration like "10:00:00" or "5:30"
      const timeParts = video.length_text.text.split(':')
      if (timeParts.length === 3) {
        // HH:MM:SS
        duration = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2])
      } else if (timeParts.length === 2) {
        // MM:SS
        duration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1])
      }
    } else if (video.duration?.seconds) {
      duration = video.duration.seconds
    }

    return {
      name: title,
      singer: reciter,
      source: 'youtube',
      songmid: `yt_${video.video_id || video.id}`,
      albumId: `yt_channel_${video.author?.id || 'unknown'}`,
      interval: formatDuration(duration),
      albumName: video.author?.name || 'YouTube Channel',
      img: video.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [
        { type: 'mp4', size: '0MB' }, // YouTube streams are typically MP4/WebM
      ],
      _types: {
        mp4: { size: '0MB' },
      },
      typeUrl: {},
      // YouTube-specific data
      youtubeId: video.video_id || video.id,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.video_id || video.id}`,
      channelName: video.author?.name,
      channelId: video.author?.id,
      views: video.view_count?.text || video.view_count,
      uploadDate: video.published?.text || video.published,
      duration,
      // Quran-specific data
      reciterName: reciter,
      surahNumber: surah.number,
      surahName: surah.name,
      isQuranRecitation: true,
    }
  },

  // Get popular Quran playlists when no search term
  getPopularQuranPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting popular Quran playlists')

    // Curated list of popular Quran playlists/channels
    const popularPlaylists = [
      {
        id: 'PLA8B5A4A4A4A4A4A4', // Example playlist ID - replace with real ones
        title: 'Complete Quran - Sheikh Mishary Rashid Alafasy',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
      {
        id: 'PLB8B5A4A4A4A4A4A4', // Example playlist ID - replace with real ones
        title: 'Complete Quran - Sheikh Abdul Rahman Al-Sudais',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
      {
        id: 'PLC8B5A4A4A4A4A4A4', // Example playlist ID - replace with real ones
        title: 'Complete Quran - Sheikh Maher Al Mueaqly',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
    ]

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPlaylists = popularPlaylists.slice(startIndex, endIndex)

    const list = paginatedPlaylists.map(playlist => ({
      name: playlist.title,
      singer: playlist.channel,
      source: 'youtube',
      songmid: `yt_playlist_${playlist.id}`,
      albumId: `yt_playlist_${playlist.id}`,
      interval: '0:00:00', // Playlists don't have duration
      albumName: playlist.channel,
      img: playlist.thumbnail,
      lrc: null,
      types: [
        { type: 'mp4', size: '0MB' },
      ],
      _types: {
        mp4: { size: '0MB' },
      },
      typeUrl: {},
      // YouTube-specific data
      youtubePlaylistId: playlist.id,
      youtubeUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
      channelName: playlist.channel,
      videoCount: playlist.videoCount,
      isPlaylist: true,
    }))

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

  // Search for specific reciter
  searchByReciter(reciterName, page = 1, limit = 30) {
    const query = buildSearchQuery(null, reciterName)
    return this.search(query, page, limit)
  },

  // Search for specific surah
  searchBySurah(surahName, page = 1, limit = 30) {
    const query = buildSearchQuery(surahName, null)
    return this.search(query, page, limit)
  },

  // Search for specific surah by specific reciter
  searchBySurahAndReciter(surahName, reciterName, page = 1, limit = 30) {
    const query = buildSearchQuery(surahName, reciterName)
    return this.search(query, page, limit)
  },
}
