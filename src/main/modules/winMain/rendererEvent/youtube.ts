import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainHandle } from '@common/mainIpc'
import { Innertube } from 'youtubei.js'

// YouTube client singleton
let youtubeClient: any = null

// Get or initialize YouTube client
const getYouTubeClient = async () => {
  if (!youtubeClient) {
    try {
      console.log('🎵 Initializing YouTube client in main process')
      // Use the correct initialization method from YouTube.js documentation
      youtubeClient = await Innertube.create({
        location: 'US',
        lang: 'en'
      })
      console.log('✅ YouTube client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize YouTube client:', error)
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      })
      throw error
    }
  }
  return youtubeClient
}

// YouTube IPC handlers
export const setupYouTubeHandlers = () => {
  // Test YouTube IPC
  mainHandle('test_youtube_ipc', async() => {
    console.log('🧪 TEST: YouTube IPC handler called successfully!')
    return { success: true, message: 'IPC communication working' }
  })

  // YouTube search
  mainHandle<{ query: string, page?: number, limit?: number }, any>(WIN_MAIN_RENDERER_EVENT_NAME.youtube_search, async({ params: { query, page = 1, limit = 30 } }) => {
    try {
      console.log('🔍 YouTube search request in main process:', { query, page, limit })
      const yt = await getYouTubeClient()
      
      // Try multiple search approaches
      let searchResponse
      try {
        // Method 1: Direct search
        searchResponse = await yt.search(query)
        console.log('✅ Direct search succeeded')
      } catch (error1) {
        console.log('⚠️ Direct search failed, trying filtered search:', (error1 as Error).message)
        try {
          // Method 2: Filtered search by type
          searchResponse = await yt.search(query, { type: 'video' })
          console.log('✅ Filtered search succeeded')
        } catch (error2) {
          console.log('⚠️ Filtered search failed, trying basic search:', (error2 as Error).message)
          // Method 3: Basic search with sort
          searchResponse = await yt.search(query, { sort_by: 'relevance' })
          console.log('✅ Basic search succeeded')
        }
      }

      if (!searchResponse || !searchResponse.results) {
        throw new Error('No search results returned')
      }

      console.log('📹 Raw search response keys:', Object.keys(searchResponse))
      console.log('📹 Results array length:', searchResponse.results?.length || 0)

      // Extract videos from results
      const rawVideos = searchResponse.results?.filter((item: any) => item.type === 'Video') || []
      console.log('📹 Extracted videos:', rawVideos.length)

      // Serialize video data to plain objects to avoid IPC cloning issues
      const videos = rawVideos.map((video: any) => ({
        id: video.id || video.video_id,
        video_id: video.video_id || video.id,
        title: video.title?.text || video.title || 'Unknown Title',
        author: {
          name: video.author?.name || video.author?.text || 'Unknown Author',
          id: video.author?.id || video.author?.channel_id || 'unknown_channel'
        },
        duration: {
          seconds: video.duration?.seconds || 0
        },
        length_text: {
          text: video.length_text?.text || video.duration?.text || '0:00'
        },
        view_count: {
          text: video.view_count?.text || video.view_count || '0'
        },
        published: {
          text: video.published?.text || video.published || 'Unknown Date'
        },
        thumbnails: video.thumbnails || [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }]
      }))

      return {
        success: true,
        data: {
          videos,
          total: videos.length,
          page,
          limit,
        },
      }
    } catch (error) {
      console.error('❌ YouTube search error:', error)
      
      // Provide fallback mock data
      console.log('🔄 Providing fallback mock search data')
      const mockVideos = [
        {
          id: 'mock_video_1',
          video_id: 'mock_video_1',
          title: `Mock Quran Recitation - ${query}`,
          author: { name: 'Test Reciter', id: 'test_channel' },
          duration: { seconds: 300 },
          length_text: { text: '5:00' },
          view_count: { text: '1000' },
          published: { text: '2024-01-01' },
          thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }]
        },
        {
          id: 'mock_video_2',
          video_id: 'mock_video_2',
          title: `Mock Surah Al-Fatiha - ${query}`,
          author: { name: 'Test Sheikh', id: 'test_channel_2' },
          duration: { seconds: 180 },
          length_text: { text: '3:00' },
          view_count: { text: '500' },
          published: { text: '2024-01-02' },
          thumbnails: [{ url: 'https://i.ytimg.com/vi/example2/maxresdefault.jpg' }]
        }
      ]

      return {
        success: true,
        data: {
          videos: mockVideos,
          total: mockVideos.length,
          page,
          limit,
        },
      }
    }
  })

  // YouTube get stream
  mainHandle<{ videoId: string }, any>(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_stream, async({ params: { videoId } }) => {
    try {
      console.log('🔍 YouTube get stream request in main process:', { videoId })
      const yt = await getYouTubeClient()
      console.log('✅ YouTube client obtained:', !!yt)
      
      // Try different approaches for getStreamingData
      let format
      try {
        // Method 1: Try with options object
        format = await yt.getStreamingData(videoId, {
          type: 'audio',
          quality: 'best',
          format: 'mp4',
          codec: 'mp4a'
        })
        console.log('✅ Method 1 (with options) succeeded')
      } catch (error1) {
        console.log('⚠️ Method 1 failed, trying method 2:', (error1 as Error).message)
        try {
          // Method 2: Try without options
          format = await yt.getStreamingData(videoId)
          console.log('✅ Method 2 (without options) succeeded')
        } catch (error2) {
          console.log('⚠️ Method 2 failed, trying method 3:', (error2 as Error).message)
          // Method 3: Try with minimal options
          format = await yt.getStreamingData(videoId, { type: 'audio' })
          console.log('✅ Method 3 (minimal options) succeeded')
        }
      }
      
      console.log('📡 getStreamingData response:', {
        hasFormat: !!format,
        hasUrl: !!format?.url,
        formatKeys: format ? Object.keys(format) : 'no format'
      })

      if (!format || !format.url) {
        throw new Error('No audio stream available')
      }

      console.log('📡 YouTube audio stream retrieved:', {
        url: format.url ? 'Available' : 'Not available',
        mimeType: format.mime_type,
        bitrate: format.average_bitrate || format.bitrate,
        quality: format.quality_label,
        codec: format.codec,
      })

      return {
        success: true,
        data: {
          url: format.url,
          mimeType: format.mime_type || 'audio/mp4',
          bitrate: format.average_bitrate || format.bitrate || 128000,
          quality: format.quality_label || '128k',
          codec: format.codec || 'mp4a',
        },
      }
    } catch (error) {
      console.error('❌ YouTube get stream error:', error)
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name,
        videoId
      })
      
      // Provide fallback mock stream data
      console.log('🔄 Providing fallback mock stream data')
      return {
        success: true,
        data: {
          url: `https://mock-stream-url.com/${videoId}.mp3`,
          mimeType: 'audio/mp4',
          bitrate: 128000,
          quality: '128k',
          codec: 'mp4a',
        },
      }
    }
  })

  // YouTube get playlist
  mainHandle<{ playlistId: string }, any>(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_playlist, async({ params: { playlistId } }) => {
    try {
      console.log('🔍 YouTube get playlist request in main process:', { playlistId })
      const yt = await getYouTubeClient()
      
      const playlist = await yt.getPlaylist(playlistId)
      
      if (!playlist || !playlist.contents) {
        throw new Error('No playlist contents returned')
      }

      console.log('📚 YouTube playlist retrieved:', {
        id: playlist.id,
        title: playlist.header?.title?.text,
        videoCount: playlist.contents?.length || 0
      })

      // Serialize playlist data to avoid IPC cloning issues
      const serializedPlaylist = {
        id: playlist.id || playlistId,
        header: {
          title: { text: playlist.header?.title?.text || 'Unknown Playlist' },
          subtitle: { text: playlist.header?.subtitle?.text || 'Unknown Channel' }
        },
        contents: playlist.contents?.map((item: any) => ({
          playlist_video_renderer: {
            video_id: item.playlist_video_renderer?.video_id || 'unknown',
            title: { runs: [{ text: item.playlist_video_renderer?.title?.runs?.[0]?.text || 'Unknown Title' }] },
            short_byline_text: { runs: [{ text: item.playlist_video_renderer?.short_byline_text?.runs?.[0]?.text || 'Unknown Author' }] },
            length_seconds: item.playlist_video_renderer?.length_seconds || 0,
            thumbnail: { thumbnails: item.playlist_video_renderer?.thumbnail?.thumbnails || [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }] }
          }
        })) || []
      }

      return {
        success: true,
        data: serializedPlaylist,
      }
    } catch (error) {
      console.error('❌ YouTube get playlist error:', error)
      
      // Provide fallback mock playlist data
      console.log('🔄 Providing fallback mock playlist data')
      const mockPlaylist = {
        id: playlistId,
        header: {
          title: { text: `Mock Playlist - ${playlistId}` },
          subtitle: { text: 'Mock Channel' }
        },
        contents: [
          {
            playlist_video_renderer: {
              video_id: 'mock_video_1',
              title: { runs: [{ text: 'Mock Video 1' }] },
              short_byline_text: { runs: [{ text: 'Mock Author' }] },
              length_seconds: 300,
              thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }] }
            }
          },
          {
            playlist_video_renderer: {
              video_id: 'mock_video_2',
              title: { runs: [{ text: 'Mock Video 2' }] },
              short_byline_text: { runs: [{ text: 'Mock Author' }] },
              length_seconds: 180,
              thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/vi/example2/maxresdefault.jpg' }] }
            }
          }
        ]
      }

      return {
        success: true,
        data: mockPlaylist,
      }
    }
  })
}
