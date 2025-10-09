import { stream, video_info, playlist_info } from 'play-dl'
import { requestMsg } from '../../message'
import { extractVideoId, getQualityLabel } from './utils'

const api_test = {
  // Get audio URL for a specific YouTube video
  getMusicUrl(songInfo, type) {
    console.log('🎵 YouTube getMusicUrl called:', { songInfo, type })
    console.log('🔍 Full songInfo object:', JSON.stringify(songInfo, null, 2))

    // Extract YouTube video ID from various possible locations
    const videoId = songInfo.youtubeId ||
                   songInfo.songmid?.replace('yt_', '') ||
                   extractVideoId(songInfo.youtubeUrl) ||
                   extractVideoId(songInfo.url)

    console.log('🌐 Extracted video ID:', videoId)

    if (!videoId) {
      console.log('❌ No YouTube video ID found')
      return {
        promise: Promise.reject(new Error('No YouTube video ID found')),
      }
    }

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      console.log('❌ Invalid YouTube video ID format:', videoId)
      return {
        promise: Promise.reject(new Error('Invalid YouTube video ID format')),
      }
    }

    console.log('🌐 Fetching audio stream for video:', videoId)

    const requestObj = {
      promise: stream(`https://www.youtube.com/watch?v=${videoId}`, {
        quality: 2, // Audio quality (0 = lowest, 2 = highest)
        type: 'audio',
      }).then(stream => {
        console.log('📡 YouTube stream response:', {
          type: stream.type,
          quality: stream.quality,
          hasAudio: !!stream.stream,
          format: stream.format,
        })

        if (!stream || !stream.stream) {
          console.log('❌ No audio stream found')
          return Promise.reject(new Error('No audio stream found for this video'))
        }

        // Get the stream URL
        const streamUrl = stream.stream.url || stream.stream
        console.log('✅ Found audio stream URL:', streamUrl)

        // Determine format based on stream
        let format = 'mp4' // Default
        if (stream.format && stream.format.includes('webm')) {
          format = 'webm'
        } else if (stream.format && stream.format.includes('mp4')) {
          format = 'mp4'
        }

        // Get quality label
        const quality = getQualityLabel(stream.quality || 128)

        return Promise.resolve({
          type: format,
          url: streamUrl,
          quality,
          bitrate: stream.quality || 128,
          format: stream.format,
          duration: stream.duration || null,
          // Add metadata for debugging
          _debug: {
            videoId,
            originalType: type,
            streamType: stream.type,
            streamFormat: stream.format,
          },
        })
      }).catch(error => {
        console.error('❌ Error fetching YouTube stream:', error)

        // Handle specific error cases
        if (error.message.includes('Video unavailable')) {
          return Promise.reject(new Error('Video is unavailable or private'))
        } else if (error.message.includes('rate limit')) {
          return Promise.reject(new Error(requestMsg.tooManyRequests))
        } else if (error.message.includes('not found')) {
          return Promise.reject(new Error('Video not found'))
        }

        return Promise.reject(new Error(`Failed to get audio stream: ${error.message}`))
      }),
    }

    return requestObj
  },

  // Get video info without streaming (for metadata)
  getVideoInfo(videoId) {
    console.log('📹 YouTube getVideoInfo called for:', videoId)

    const requestObj = {
      promise: video_info(`https://www.youtube.com/watch?v=${videoId}`)
        .then(info => {
          console.log('📡 YouTube video info response:', {
            title: info.video_details?.title,
            duration: info.video_details?.durationInSec,
            channel: info.video_details?.channel?.name,
            views: info.video_details?.views,
          })

          if (!info || !info.video_details) {
            return Promise.reject(new Error('No video information found'))
          }

          return Promise.resolve({
            title: info.video_details.title,
            duration: info.video_details.durationInSec,
            channel: info.video_details.channel?.name,
            views: info.video_details.views,
            description: info.video_details.description,
            thumbnail: info.video_details.thumbnails?.[0]?.url,
            uploadDate: info.video_details.uploadDate,
            isLive: info.video_details.isLive,
          })
        })
        .catch(error => {
          console.error('❌ Error fetching YouTube video info:', error)
          return Promise.reject(error)
        }),
    }

    return requestObj
  },

  // Get playlist info
  getPlaylistInfo(playlistId) {
    console.log('📋 YouTube getPlaylistInfo called for:', playlistId)

    const requestObj = {
      promise: playlist_info(`https://www.youtube.com/playlist?list=${playlistId}`)
        .then(playlist => {
          console.log('📡 YouTube playlist info response:', {
            title: playlist.title,
            videoCount: playlist.video_count,
            channel: playlist.channel?.name,
          })

          if (!playlist) {
            return Promise.reject(new Error('No playlist information found'))
          }

          return Promise.resolve({
            title: playlist.title,
            description: playlist.description,
            videoCount: playlist.video_count,
            channel: playlist.channel?.name,
            thumbnail: playlist.thumbnail?.url,
            videos: playlist.videos || [],
          })
        })
        .catch(error => {
          console.error('❌ Error fetching YouTube playlist info:', error)
          return Promise.reject(error)
        }),
    }

    return requestObj
  },
}

export default api_test
