import musicSearch from './musicSearch'
import songList from './songList'
import leaderboard from './leaderboard'
import hotSearch from './hotSearch'
import comment from './comment'
import { stream_from_info, video_info } from 'play-dl'
import { extractVideoId, getQualityLabel } from './utils'

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
      promise: video_info(`https://www.youtube.com/watch?v=${videoId}`)
        .then(info => {
          console.log('📡 YouTube video info:', {
            title: info.video_details?.title,
            duration: info.video_details?.durationInSec,
            isLive: info.video_details?.isLive,
            available: !!info.video_details,
            videoId: info.video_details?.id,
            url: info.video_details?.url,
          })

          if (!info || !info.video_details) {
            return Promise.reject(new Error('Video not found or unavailable'))
          }

          // Try to get the stream with different quality levels using stream_from_info
          const tryStream = async(quality) => {
            try {
              return await stream_from_info(info, {
                quality,
                type: 'audio',
              })
            } catch (error) {
              console.log(`❌ Failed to get stream with quality ${quality}:`, error.message)
              throw error
            }
          }

          // Try quality 0 first, then fallback to 1, then 2
          return tryStream(0).catch(() =>
            tryStream(1).catch(() =>
              tryStream(2),
            ),
          )
        })
        .then(stream => {
          console.log('📡 YouTube stream response:', {
            type: stream.type,
            quality: stream.quality,
            hasAudio: !!stream.stream,
            format: stream.format,
            url: stream.url,
            duration: stream.duration,
          })

          if (!stream || !stream.stream) {
            console.log('❌ No audio stream found')
            return Promise.reject(new Error('No audio stream found for this video'))
          }

          const streamUrl = stream.url
          const format = stream.format

          // Get quality label
          const quality = getQualityLabel(stream.quality || 128)

          return Promise.resolve({
            type: format,
            url: streamUrl,
            quality,
            bitrate: stream.quality || 128,
            format: stream.format,
            duration: stream.duration || null,
            _debug: {
              videoId,
              originalType: type,
              streamType: stream.type,
              streamFormat: stream.format,
            },
          })
        }).catch(error => {
          console.error('❌ Error fetching YouTube stream:', error)
          console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            videoId,
          })

          if (error.message.includes('Video unavailable')) {
            return Promise.reject(new Error('Video is unavailable or private'))
          } else if (error.message.includes('rate limit')) {
            return Promise.reject(new Error('Too many requests'))
          } else if (error.message.includes('not found')) {
            return Promise.reject(new Error('Video not found'))
          } else if (error.message.includes('Invalid URL')) {
            return Promise.reject(new Error('Invalid video URL or video not accessible'))
          }

          return Promise.reject(new Error(`Failed to get audio stream: ${error.message}`))
        }),
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
