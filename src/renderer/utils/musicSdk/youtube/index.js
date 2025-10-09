import musicSearch from './musicSearch'
import songList from './songList'
import leaderboard from './leaderboard'
import hotSearch from './hotSearch'
import comment from './comment'
import { extractVideoId, getQualityLabel } from './utils'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { rendererInvoke } from '@common/rendererIpc'

const youtube = {
  musicSearch,
  songList,
  leaderboard,
  hotSearch,
  comment,

  getMusicUrl(songInfo, type) {
    console.log('🎵 YouTube getMusicUrl called:', { songInfo, type })

    // Extract YouTube video ID from various possible locations
    const videoId = songInfo.youtubeId ||
                   songInfo.songmid?.replace('yt_', '') ||
                   extractVideoId(songInfo.youtubeUrl) ||
                   extractVideoId(songInfo.url)

    console.log('🌐 Extracted video ID:', videoId)

    if (!videoId) {
      console.log('❌ No YouTube video ID found')
      return Promise.reject(new Error('No YouTube video ID found'))
    }

    // Check if the videoId is a playlist ID
    if (videoId.startsWith('PL') || videoId.startsWith('LL') || videoId.startsWith('RD')) {
      console.log('⚠️ Detected playlist ID, but getMusicUrl expects video ID:', videoId)
      return Promise.reject(new Error('Playlist ID provided to getMusicUrl, expected video ID'))
    }

    console.log('🌐 Fetching audio stream for video:', videoId)

    const requestObj = {
      promise: (async() => {
        try {
          console.log('📡 Getting YouTube stream via IPC:', videoId)

          const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_stream, {
            videoId,
          })

          if (!response.success) {
            throw new Error(response.error || 'Failed to get YouTube stream')
          }

          const streamData = response.data
          const bitrate = parseInt(streamData.bitrate || 128)
          const quality = getQualityLabel(bitrate)
          const format = streamData.mimeType?.includes('webm') ? 'webm' : 'mp4'

          console.log('📡 YouTube stream data received:', {
            mimeType: streamData.mimeType,
            bitrate,
            quality,
            url: streamData.url ? 'Available' : 'Not available',
            codec: streamData.codec,
          })

          // Log the actual URL for debugging (first 100 chars)
          if (streamData.url) {
            console.log('🔗 Stream URL preview:', streamData.url.substring(0, 100) + '...')
          }

          return {
            type: format,
            url: streamData.url,
            quality,
            bitrate,
            format: streamData.mimeType,
            codec: streamData.codec,
            duration: null, // Will be filled from video details if needed
            _debug: {
              videoId,
              originalType: type,
              mimeType: streamData.mimeType,
              bitrate,
              codec: streamData.codec,
            },
          }
        } catch (error) {
          console.error('❌ Error fetching YouTube stream:', error)
          console.error('❌ Error details:', {
            message: error.message,
            videoId,
          })

          if (error.message.includes('Video unavailable') || error.message.includes('private')) {
            return Promise.reject(new Error('Video is unavailable or private'))
          } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
            return Promise.reject(new Error('Too many requests'))
          } else if (error.message.includes('not found') || error.message.includes('404')) {
            return Promise.reject(new Error('Video not found'))
          } else if (error.message.includes('Invalid') || error.message.includes('malformed')) {
            return Promise.reject(new Error('Invalid video URL or video not accessible'))
          }

          return Promise.reject(new Error(`Failed to get audio stream: ${error.message}`))
        }
      })(),
    }

    return requestObj
  },

  getLyric(songInfo) {
    // YouTube videos don't have traditional lyrics, but we can return video description
    return {
      promise: Promise.resolve({
        lyric: songInfo.description || '',
        tlyric: '',
        lxlyric: '',
        rlyric: '',
      }),
    }
  },

  getPic(songInfo) {
    // Return video thumbnail
    return Promise.resolve(songInfo.img || songInfo.thumbnail || '')
  },

  getMusicDetailPageUrl(songInfo) {
    return songInfo.youtubeUrl || `https://www.youtube.com/watch?v=${songInfo.youtubeId}`
  },

  // Handle music info - transform YouTube data to music SDK format
  handleMusicInfo(songInfo) {
    return Promise.resolve({
      name: songInfo.name,
      singer: songInfo.singer,
      img: songInfo.img,
      albumName: songInfo.albumName,
      interval: songInfo.interval,
      ...songInfo,
    })
  },

  formatDuration(seconds) {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  // Initialize YouTube SDK
  init() {
    console.log('🎵 Initializing YouTube Music SDK')
    // No initialization needed for play-dl
    return Promise.resolve()
  },
}

export default youtube
