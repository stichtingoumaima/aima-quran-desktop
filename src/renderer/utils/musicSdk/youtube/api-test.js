import { extractVideoId, getQualityLabel } from './utils'
import { requestMsg } from '../../message'

// NOTE: This test file is temporarily disabled as it uses direct youtubei.js calls
// All YouTube functionality now goes through IPC to the main process
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
      promise: Promise.reject(new Error('YouTube API test functions disabled - using IPC instead'))
        // .then(yt => yt.getInfo(videoId))
        .then(info => {
          console.log('📡 YouTube video info:', {
            title: info.basic_info?.title,
            duration: info.basic_info?.duration?.seconds,
            isLive: info.basic_info?.is_live,
            available: !!info.basic_info,
            videoId: info.basic_info?.id,
          })

          if (!info || !info.basic_info) {
            return Promise.reject(new Error('Video not found or unavailable'))
          }

          // Get the best audio format
          const audioFormats = info.streaming_data?.adaptive_formats?.filter(format =>
            format.has_audio && !format.has_video,
          ) || []

          if (audioFormats.length === 0) {
            console.log('❌ No audio formats found')
            return Promise.reject(new Error('No audio formats available for this video'))
          }

          // Select the highest quality audio format
          const bestAudioFormat = audioFormats.reduce((best, current) => {
            const currentBitrate = parseInt(current.average_bitrate || current.bitrate || 0)
            const bestBitrate = parseInt(best.average_bitrate || best.bitrate || 0)
            return currentBitrate > bestBitrate ? current : best
          })

          console.log('📡 Selected audio format:', {
            mimeType: bestAudioFormat.mime_type,
            bitrate: bestAudioFormat.average_bitrate || bestAudioFormat.bitrate,
            quality: bestAudioFormat.quality_label,
            url: bestAudioFormat.url ? 'Available' : 'Not available',
          })

          if (!bestAudioFormat.url) {
            console.log('❌ No stream URL found in format')
            return Promise.reject(new Error('No stream URL available for this video'))
          }

          const streamUrl = bestAudioFormat.url
          const format = bestAudioFormat.mime_type?.includes('webm') ? 'webm' : 'mp4'
          const bitrate = parseInt(bestAudioFormat.average_bitrate || bestAudioFormat.bitrate || 128)
          const quality = getQualityLabel(bitrate)

          return Promise.resolve({
            type: format,
            url: streamUrl,
            quality,
            bitrate,
            format: bestAudioFormat.mime_type,
            duration: info.basic_info?.duration?.seconds || null,
            // Add metadata for debugging
            _debug: {
              videoId,
              originalType: type,
              mimeType: bestAudioFormat.mime_type,
              bitrate,
            },
          })
        }).catch(error => {
          console.error('❌ Error fetching YouTube stream:', error)

          // Handle specific error cases
          if (error.message.includes('Video unavailable') || error.message.includes('private')) {
            return Promise.reject(new Error('Video is unavailable or private'))
          } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
            return Promise.reject(new Error(requestMsg.tooManyRequests))
          } else if (error.message.includes('not found') || error.message.includes('404')) {
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
      promise: Promise.reject(new Error('YouTube API test functions disabled - using IPC instead'))
        // .then(yt => yt.getInfo(videoId))
        .then(info => {
          console.log('📡 YouTube video info response:', {
            title: info.basic_info?.title,
            duration: info.basic_info?.duration?.seconds,
            channel: info.basic_info?.author,
            views: info.basic_info?.view_count,
          })

          if (!info || !info.basic_info) {
            return Promise.reject(new Error('No video information found'))
          }

          return Promise.resolve({
            title: info.basic_info.title,
            duration: info.basic_info.duration?.seconds,
            channel: info.basic_info.author,
            views: info.basic_info.view_count,
            description: info.basic_info.short_description,
            thumbnail: info.basic_info.thumbnail?.[0]?.url,
            uploadDate: info.basic_info.publish_date,
            isLive: info.basic_info.is_live,
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
      promise: Promise.reject(new Error('YouTube API test functions disabled - using IPC instead'))
        // .then(yt => yt.getPlaylist(playlistId))
        .then(playlist => {
          console.log('📡 YouTube playlist info response:', {
            title: playlist.header?.title?.text,
            videoCount: playlist.contents?.length || 0,
            channel: playlist.header?.subtitle?.text,
          })

          if (!playlist) {
            return Promise.reject(new Error('No playlist information found'))
          }

          return Promise.resolve({
            title: playlist.header?.title?.text,
            description: playlist.description,
            videoCount: playlist.contents?.length || 0,
            channel: playlist.header?.subtitle?.text,
            thumbnail: playlist.header?.playlist_header_banner?.hero_banner?.banner_image?.sources?.[0]?.url,
            videos: playlist.contents || [],
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
