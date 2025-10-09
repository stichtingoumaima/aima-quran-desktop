import { playlist_info, search } from 'play-dl'
import { formatDuration, extractReciterFromTitle, extractSurahFromTitle, isQuranRecitation } from './utils'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get videos from a YouTube playlist
  getPlaylistVideos(playlistId, page = 1, limit = 30) {
    console.log('📋 YouTube songList.getPlaylistVideos called:', { playlistId, page, limit })

    const requestObj = {
      promise: playlist_info(`https://www.youtube.com/playlist?list=${playlistId}`)
        .then(playlist => {
          console.log('📡 YouTube playlist response:', {
            title: playlist.title,
            videoCount: playlist.video_count,
            channel: playlist.channel?.name,
          })

          if (!playlist || !playlist.videos) {
            return Promise.reject(new Error('No playlist videos found'))
          }

          // Filter for Quran recitations
          const quranVideos = playlist.videos.filter(video =>
            isQuranRecitation(video.title),
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
              name: playlist.title,
              author: playlist.channel?.name || 'YouTube Channel',
              desc: playlist.description || `Quran recitation playlist with ${quranVideos.length} videos`,
              img: playlist.thumbnail?.url || '',
              play_count: null,
              total: quranVideos.length,
            },
          }
        })
        .catch(error => {
          console.error('❌ Error fetching playlist videos:', error)
          return Promise.reject(error)
        }),
    }

    return requestObj.promise
  },

  // Transform YouTube video to music SDK format
  transformVideoToSong(video, playlist = null) {
    const reciter = extractReciterFromTitle(video.title)
    const surah = extractSurahFromTitle(video.title)

    return {
      name: video.title,
      singer: reciter,
      source: 'youtube',
      songmid: `yt_${video.id}`,
      albumId: playlist ? `yt_playlist_${playlist.id}` : `yt_channel_${video.channel?.id || 'unknown'}`,
      interval: formatDuration(video.durationInSec || 0),
      albumName: playlist ? playlist.title : (video.channel?.name || 'YouTube Channel'),
      img: video.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [
        { type: 'mp4', size: '0MB' },
      ],
      _types: {
        mp4: { size: '0MB' },
      },
      typeUrl: {},
      // YouTube-specific data
      youtubeId: video.id,
      youtubeUrl: video.url,
      channelName: video.channel?.name,
      channelId: video.channel?.id,
      views: video.views,
      uploadDate: video.uploadedAt,
      duration: video.durationInSec,
      // Quran-specific data
      reciterName: reciter,
      surahNumber: surah.number,
      surahName: surah.name,
      isQuranRecitation: true,
      // Playlist-specific data
      playlistId: playlist?.id,
      playlistTitle: playlist?.title,
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
      promise: search(`${str} quran playlist`, {
        limit,
        type: 'playlist',
      }).then(results => {
        console.log('📡 YouTube playlist search response:', {
          resultCount: results.length,
          firstResult: results[0]?.title,
        })

        if (!results || results.length === 0) {
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
        const filteredResults = results
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
      }).catch(error => {
        console.error('❌ YouTube playlist search error:', error)
        return this.search(str, page, limit, retryNum)
      }),
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
      name: playlist.title,
      singer: playlist.channel?.name || 'YouTube Channel',
      source: 'youtube',
      songmid: `yt_playlist_${playlist.id}`,
      albumId: `yt_playlist_${playlist.id}`,
      interval: '0:00:00', // Playlists don't have duration
      albumName: playlist.channel?.name || 'YouTube Channel',
      img: playlist.thumbnail?.url || '',
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
      youtubeUrl: playlist.url,
      channelName: playlist.channel?.name,
      channelId: playlist.channel?.id,
      videoCount: playlist.video_count,
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
