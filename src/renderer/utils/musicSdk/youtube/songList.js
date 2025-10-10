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
          })

          if (!response.success) {
            throw new Error(response.error || 'YouTube playlist search failed')
          }

          const searchResponse = response.data
          const results = searchResponse.contents?.two_column_search_results?.primary_contents?.section_list_contents?.contents || []
          const playlists = results
            .filter(item => item.playlist_renderer)
            .map(item => item.playlist_renderer)
            .slice(0, limit)

          console.log('📡 YouTube playlist search response:', {
            resultCount: playlists.length,
            firstResult: playlists[0]?.title?.runs?.[0]?.text,
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
            .filter(playlist => this.isQuranPlaylist(playlist.title?.runs?.[0]?.text))
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
    return {
      name: playlist.title?.runs?.[0]?.text || 'Unknown Playlist',
      singer: playlist.short_byline_text?.runs?.[0]?.text || 'YouTube Channel',
      source: 'youtube',
      songmid: `yt_playlist_${playlist.playlist_id}`,
      albumId: `yt_playlist_${playlist.playlist_id}`,
      interval: '0:00:00', // Playlists don't have duration
      albumName: playlist.short_byline_text?.runs?.[0]?.text || 'YouTube Channel',
      img: playlist.thumbnail_renderer?.playlist_video_thumbnail_renderer?.thumbnail?.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [
        { type: 'mp4', size: '0MB' },
      ],
      _types: {
        mp4: { size: '0MB' },
      },
      typeUrl: {},
      // YouTube-specific data
      youtubePlaylistId: playlist.playlist_id,
      youtubeUrl: `https://www.youtube.com/playlist?list=${playlist.playlist_id}`,
      channelName: playlist.short_byline_text?.runs?.[0]?.text,
      channelId: playlist.short_byline_text?.runs?.[0]?.navigation_endpoint?.browse_endpoint?.browse_id,
      videoCount: playlist.video_count?.text || playlist.video_count,
      isPlaylist: true,
    }
  },

  // Get popular Quran playlists
  getPopularQuranPlaylists(page = 1, limit = 30) {
    console.log('📋 Getting popular Quran playlists')

    // Curated list of popular Quran playlists
    const popularPlaylists = [
      {
        id: 'PLA8B5A4A4A4A4A4A4', // Replace with real playlist IDs
        title: 'Complete Quran - Sheikh Mishary Rashid Alafasy',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
      {
        id: 'PLB8B5A4A4A4A4A4A4', // Replace with real playlist IDs
        title: 'Complete Quran - Sheikh Abdul Rahman Al-Sudais',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
      {
        id: 'PLC8B5A4A4A4A4A4A4', // Replace with real playlist IDs
        title: 'Complete Quran - Sheikh Maher Al Mueaqly',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
      {
        id: 'PLD8B5A4A4A4A4A4A4', // Replace with real playlist IDs
        title: 'Complete Quran - Sheikh Saad Al-Ghamdi',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
      },
      {
        id: 'PLE8B5A4A4A4A4A4A4', // Replace with real playlist IDs
        title: 'Complete Quran - Sheikh Muhammad Al-Luhaidan',
        channel: 'Quran Recitation',
        videoCount: 114,
        thumbnail: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
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
    return Promise.resolve([])
  },

  getList() {
    return this.getPopularQuranPlaylists(1, this.limit)
  },

  sortList: [
    { name: 'Default', id: 'default' },
    { name: 'Most Popular', id: 'popular' },
    { name: 'Newest', id: 'newest' },
  ],
}
