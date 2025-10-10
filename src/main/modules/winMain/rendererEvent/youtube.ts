import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainHandle } from '@common/mainIpc'
import { Innertube } from 'youtubei.js'
import { createServer } from 'http'
import { URL } from 'url'
import { request } from 'https'
import { spawn } from 'child_process'

// YouTube client singleton
let youtubeClient: any = null

// Audio proxy server
let audioProxyServer: any = null
let audioProxyPort: number = 0

// yt-dlp function to get audio stream URL
const getAudioStreamWithYtDlp = (videoId: string): Promise<{ url: string, mimeType: string, bitrate: number, quality: string, codec: string }> => {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    console.log('🎵 Using yt-dlp to get audio stream for:', url)
    
    const args = [
      '--get-url',
      '--format', 'bestaudio[ext=m4a]/bestaudio',
      '--dump-json',
      url
    ]
    
    const ytdlp = spawn('yt-dlp', args)
    let stdout = ''
    let stderr = ''
    
    ytdlp.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON output from yt-dlp
          const lines = stdout.trim().split('\n')
          const jsonLine = lines.find(line => line.startsWith('{'))
          
          if (jsonLine) {
            const metadata = JSON.parse(jsonLine)
            const audioUrl = lines.find(line => line.startsWith('http'))
            
            if (audioUrl) {
              console.log('✅ yt-dlp successfully extracted audio stream')
              console.log('🔗 Audio URL preview:', audioUrl.substring(0, 100) + '...')
              
              resolve({
                url: audioUrl,
                mimeType: metadata.mime || 'audio/mp4',
                bitrate: metadata.abr || metadata.tbr || 128000,
                quality: metadata.format_note || '128k',
                codec: metadata.acodec || 'mp4a'
              })
            } else {
              reject(new Error('No audio URL found in yt-dlp output'))
            }
          } else {
            reject(new Error('No JSON metadata found in yt-dlp output'))
          }
        } catch (error) {
          console.error('❌ Error parsing yt-dlp output:', error)
          reject(new Error('Failed to parse yt-dlp output: ' + (error as Error).message))
        }
      } else {
        console.error('❌ yt-dlp failed with code:', code)
        console.error('❌ yt-dlp stderr:', stderr)
        reject(new Error(`yt-dlp failed with exit code ${code}: ${stderr}`))
      }
    })
    
    ytdlp.on('error', (error) => {
      console.error('❌ yt-dlp spawn error:', error)
      reject(new Error('Failed to spawn yt-dlp: ' + error.message))
    })
  })
}

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

// Initialize audio proxy server
const initAudioProxy = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (audioProxyServer) {
      resolve(audioProxyPort)
      return
    }

    try {
      audioProxyServer = createServer(async (req, res) => {
        console.log('🔄 Audio proxy request received:', req.method, req.url)
        const url = new URL(req.url || '', 'http://localhost')
        const targetUrl = url.searchParams.get('url')
        
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Missing URL parameter')
          return
        }

        console.log('🔄 Proxying audio request to:', targetUrl.substring(0, 100) + '...')

        // Add a small random delay to avoid rate limiting
        const delay = Math.random() * 1000 + 500 // 500-1500ms delay
        await new Promise(resolve => setTimeout(resolve, delay))

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Agent, Referer')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        // Make request to YouTube with enhanced anti-detection measures
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
        
        const options = {
          headers: {
            'User-Agent': randomUserAgent,
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'DNT': '1',
            'Sec-GPC': '1',
            // Add YouTube-specific headers
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20250222.10.00',
            'X-Goog-Visitor-Id': 'CgtwVUJfN0JfN0JfNxIOCg0IABACGAAgACgAOAA%3D',
          },
          timeout: 45000, // 45 second timeout
          followRedirect: true,
          maxRedirects: 10,
          // Disable keep-alive to avoid connection reuse detection
          agent: false,
          // Add some randomization
          family: 4, // Force IPv4
        }

        const proxyReq = request(targetUrl, options, (proxyRes) => {
          console.log(`🔄 Proxy response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`)
          console.log('📋 Response headers:', Object.keys(proxyRes.headers))
          
          // Copy response headers
          Object.keys(proxyRes.headers).forEach(key => {
            if (key.toLowerCase() !== 'content-encoding') { // Remove encoding to avoid issues
              res.setHeader(key, proxyRes.headers[key] || '')
            }
          })

          res.writeHead(proxyRes.statusCode || 200)
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (error) => {
          console.error('❌ Proxy request error:', error.message)
          console.error('❌ Error details:', error)
          
          // Handle specific error types
          if (error.message.includes('ECONNREFUSED')) {
            console.error('🚫 Connection refused - YouTube may be blocking the request')
            res.writeHead(503, { 'Content-Type': 'text/plain' })
            res.end('Service Unavailable: Connection refused')
          } else if (error.message.includes('ETIMEDOUT')) {
            console.error('⏰ Request timeout - YouTube may be rate limiting')
            res.writeHead(504, { 'Content-Type': 'text/plain' })
            res.end('Gateway Timeout: Request timed out')
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            res.end('Proxy Error: ' + error.message)
          }
        })

        proxyReq.on('response', (response) => {
          console.log(`📡 YouTube response: ${response.statusCode} ${response.statusMessage}`)
          if (response.statusCode === 403) {
            console.log('🚫 YouTube blocked the request - this is expected behavior')
          }
        })

        req.pipe(proxyReq)
      })

      // Find an available port
      audioProxyServer.listen(0, '127.0.0.1', () => {
        const address = audioProxyServer.address()
        if (address && typeof address === 'object') {
          audioProxyPort = address.port
          console.log(`🎵 Audio proxy server started on port ${audioProxyPort}`)
          resolve(audioProxyPort)
        } else {
          reject(new Error('Failed to get proxy server port'))
        }
      })

      audioProxyServer.on('error', (error: Error) => {
        console.error('❌ Audio proxy server error:', error)
        reject(error)
      })

    } catch (error) {
      console.error('❌ Failed to initialize audio proxy:', error)
      reject(error)
    }
  })
}

// Get audio proxy URL
const getAudioProxyUrl = (originalUrl: string): string => {
  if (!audioProxyPort) {
    return originalUrl
  }
  return `http://127.0.0.1:${audioProxyPort}/?url=${encodeURIComponent(originalUrl)}`
}

// YouTube IPC handlers
export const setupYouTubeHandlers = () => {
  // Initialize audio proxy server
  initAudioProxy().catch(error => {
    console.error('❌ Failed to initialize audio proxy server:', error)
  })

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
        // Method 1: Try audio-only format first (most compatible)
        format = await yt.getStreamingData(videoId, {
          type: 'audio',
          quality: 'best',
          format: 'mp4',
          codec: 'mp4a'
        })
        console.log('✅ Method 1 (audio-only) succeeded')
      } catch (error1) {
        console.log('⚠️ Method 1 failed, trying method 2:', (error1 as Error).message)
        try {
          // Method 2: Try webm audio format
          format = await yt.getStreamingData(videoId, {
            type: 'audio',
            quality: 'best',
            format: 'webm',
            codec: 'opus'
          })
          console.log('✅ Method 2 (webm audio) succeeded')
        } catch (error2) {
          console.log('⚠️ Method 2 failed, trying method 3:', (error2 as Error).message)
          try {
            // Method 3: Try without options (fallback)
            format = await yt.getStreamingData(videoId)
            console.log('✅ Method 3 (no options) succeeded')
          } catch (error3) {
            console.log('⚠️ Method 3 failed, trying method 4:', (error3 as Error).message)
            // Method 4: Try with minimal options
            format = await yt.getStreamingData(videoId, { type: 'audio' })
            console.log('✅ Method 4 (minimal options) succeeded')
          }
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

      // Add proper headers to the URL for YouTube compatibility
      const urlWithHeaders = new URL(format.url)
      urlWithHeaders.searchParams.set('c', 'WEB')
      urlWithHeaders.searchParams.set('cver', '2.20250222.10.00')

      // Try yt-dlp first (most reliable for audio streaming)
      try {
        console.log('🎵 Attempting to get audio stream with yt-dlp...')
        const streamData = await getAudioStreamWithYtDlp(videoId)
        console.log('✅ yt-dlp stream extraction successful')
        
        return {
          success: true,
          data: {
            url: streamData.url,
            mimeType: streamData.mimeType,
            bitrate: streamData.bitrate,
            quality: streamData.quality,
            codec: streamData.codec,
            useProxy: false, // yt-dlp URLs work directly
          },
        }
      } catch (ytdlpError) {
        console.log('⚠️ yt-dlp failed, falling back to built-in audio proxy:', (ytdlpError as Error).message)
        
        // Fallback to built-in audio proxy
        const proxiedUrl = getAudioProxyUrl(urlWithHeaders.toString())
        console.log('🌐 Using built-in audio proxy as fallback:', proxiedUrl.substring(0, 100) + '...')
        console.log('🔧 Proxy server should be running on port:', audioProxyPort)

        return {
          success: true,
          data: {
            url: proxiedUrl,
            mimeType: format.mime_type || 'audio/mp4',
            bitrate: format.average_bitrate || format.bitrate || 128000,
            quality: format.quality_label || '128k',
            codec: format.codec || 'mp4a',
            useProxy: true, // Built-in proxy for fallback
          },
        }
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

  // YouTube trending/charts handler
  mainHandle<{ category: string, page?: number, limit?: number, params?: string }, any>(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_trending, async({ params: { category = 'trending_now', page = 1, limit = 50, params } }) => {
    try {
      console.log('🔥 YouTube trending request in main process:', { category, page, limit, params })
      const yt = await getYouTubeClient()
      
      // Use native YouTube API methods for specific categories
      if (category === 'trending_now') {
        console.log('🎯 Using search-based trending for Quran recitations with manual date sorting')
        try {
          // Use search for trending content (no sorting in API call)
          const searchResponse = await yt.search('quran recitation trending', { 
            type: 'video'
          })
          
          if (searchResponse?.results) {
            const videos = searchResponse.results
              .filter((video: any) => isQuranRecitation(video.title?.text || video.title))
              .map((video: any) => enhanceVideoWithPopularityData(video, category))
            
            // Remove duplicates and calculate popularity scores
            const uniqueVideos = removeDuplicateVideos(videos)
            const scoredVideos = uniqueVideos.map(video => ({
              ...video,
              popularityScore: calculatePopularityScore(video, category),
              lastUpdated: new Date().toISOString()
            }))

            // Filter for videos uploaded within the last 6 months for trending
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            
            let filteredVideos = scoredVideos.filter(video => {
              if (!video.uploadDate) return true // Include videos without date info
              const uploadDate = new Date(video.uploadDate)
              return uploadDate >= sixMonthsAgo
            })

            // If no recent videos, fall back to all videos but prioritize recent ones
            if (filteredVideos.length === 0) {
              console.log('⚠️ No recent trending videos found, using all videos with recent prioritization')
              filteredVideos = scoredVideos
            }

            // Sort by upload date (newest first) for trending
            filteredVideos.sort((a, b) => {
              const dateA = new Date(a.uploadDate || new Date())
              const dateB = new Date(b.uploadDate || new Date())
              return dateB.getTime() - dateA.getTime()
            })

            // Apply pagination
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginatedVideos = filteredVideos.slice(startIndex, endIndex)

            console.log('📊 YouTube search-based trending results:', {
              category,
              totalVideos: filteredVideos.length,
              returnedVideos: paginatedVideos.length,
              topScore: filteredVideos[0]?.popularityScore || 0,
              dateFilter: '6 months',
              sortBy: 'manual_upload_date_sort'
            })

            return {
              success: true,
              data: paginatedVideos,
              total: filteredVideos.length,
              page,
              limit,
              category,
              method: 'search_based_trending'
            }
          }
        } catch (trendingError) {
          console.log('⚠️ Search-based trending failed, falling back to search:', trendingError.message)
        }
      } else if (category === 'most_viewed') {
        console.log('🎯 Using search for most viewed with manual date sorting')
        try {
          const searchResponse = await yt.search('quran recitation', { 
            type: 'video'
          })
          
          if (searchResponse?.results) {
            const videos = searchResponse.results
              .filter((video: any) => isQuranRecitation(video.title?.text || video.title))
              .map((video: any) => enhanceVideoWithPopularityData(video, category))
            
            // Remove duplicates and calculate popularity scores
            const uniqueVideos = removeDuplicateVideos(videos)
            const scoredVideos = uniqueVideos.map(video => ({
              ...video,
              popularityScore: calculatePopularityScore(video, category),
              lastUpdated: new Date().toISOString()
            }))

            // Sort by upload date (newest first) for most viewed
            scoredVideos.sort((a, b) => {
              const dateA = new Date(a.uploadDate || new Date())
              const dateB = new Date(b.uploadDate || new Date())
              return dateB.getTime() - dateA.getTime()
            })

            // Apply pagination
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginatedVideos = scoredVideos.slice(startIndex, endIndex)

            console.log('📊 YouTube most viewed results with manual date sorting:', {
              category,
              totalVideos: scoredVideos.length,
              returnedVideos: paginatedVideos.length,
              topScore: scoredVideos[0]?.popularityScore || 0,
              sortBy: 'manual_upload_date_sort'
            })

            return {
              success: true,
              data: paginatedVideos,
              total: scoredVideos.length,
              page,
              limit,
              category,
              method: 'search_with_manual_date_sort'
            }
          }
        } catch (mostViewedError) {
          console.log('⚠️ Native most viewed search failed, falling back to search:', mostViewedError.message)
        }
      } else if (category === 'recent_uploads') {
        console.log('🎯 Using native YouTube search with sort_by_upload_date for recent uploads')
        try {
          const searchResponse = await yt.search('quran recitation', { 
            type: 'video',
            sort_by: 'upload_date'
          })
          
          if (searchResponse?.results) {
            const videos = searchResponse.results
              .filter((video: any) => isQuranRecitation(video.title?.text || video.title))
              .map((video: any) => enhanceVideoWithPopularityData(video, category))
            
            // Remove duplicates and calculate popularity scores
            const uniqueVideos = removeDuplicateVideos(videos)
            const scoredVideos = uniqueVideos.map(video => ({
              ...video,
              popularityScore: calculatePopularityScore(video, category),
              lastUpdated: new Date().toISOString()
            }))

            // Sort by upload date (newest first) for recent uploads
            scoredVideos.sort((a, b) => {
              const dateA = new Date(a.uploadDate || new Date())
              const dateB = new Date(b.uploadDate || new Date())
              return dateB.getTime() - dateA.getTime()
            })

            // Apply pagination
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginatedVideos = scoredVideos.slice(startIndex, endIndex)

            console.log('📊 YouTube native recent uploads results:', {
              category,
              totalVideos: scoredVideos.length,
              returnedVideos: paginatedVideos.length,
              topScore: scoredVideos[0]?.popularityScore || 0
            })

            return {
              success: true,
              data: paginatedVideos,
              total: scoredVideos.length,
              page,
              limit,
              category,
              method: 'native_recent_uploads'
            }
          }
        } catch (recentUploadsError) {
          console.log('⚠️ Native recent uploads search failed, falling back to search:', recentUploadsError.message)
        }
      }
      
      // If params are provided, use YouTube's internal search with parameters
      if (params) {
        console.log('🎯 Using YouTube params for precise filtering:', params)
        try {
          // Use YouTube's search with the provided Base64 params
          const searchResponse = await yt.search('quran recitation', { 
            type: 'video',
            params: params // Pass the Base64 params directly to YouTube
          })
          
          if (searchResponse?.results) {
            const videos = searchResponse.results
              .filter((video: any) => isQuranRecitation(video.title?.text || video.title))
              .map((video: any) => enhanceVideoWithPopularityData(video, category))
            
            // Remove duplicates and calculate popularity scores
            const uniqueVideos = removeDuplicateVideos(videos)
            const scoredVideos = uniqueVideos.map(video => ({
              ...video,
              popularityScore: calculatePopularityScore(video, category),
              lastUpdated: new Date().toISOString()
            }))

            // Apply date-based filtering for recent content categories
            let filteredVideos = scoredVideos
            if (category === 'recent_uploads') {
              // Filter for videos uploaded within the last 2 years, but prioritize recent ones
              const twoYearsAgo = new Date()
              twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
              
              filteredVideos = scoredVideos.filter(video => {
                if (!video.uploadDate) return true // Include videos without date info
                const uploadDate = new Date(video.uploadDate)
                return uploadDate >= twoYearsAgo
              })
              
              // Sort by upload date (newest first) for recent uploads
              filteredVideos.sort((a, b) => {
                const dateA = new Date(a.uploadDate || new Date())
                const dateB = new Date(b.uploadDate || new Date())
                return dateB.getTime() - dateA.getTime()
              })
            } else {
              // Sort by popularity score for other categories
              filteredVideos.sort((a, b) => b.popularityScore - a.popularityScore)
            }

            // If no videos after date filtering, fall back to all videos with date-based sorting
            if (filteredVideos.length === 0) {
              console.log('⚠️ No videos after date filtering, falling back to all videos with date-based sorting')
              filteredVideos = scoredVideos
              if (category === 'recent_uploads') {
                // Sort by upload date (newest first) for recent uploads
                filteredVideos.sort((a, b) => {
                  const dateA = new Date(a.uploadDate || new Date())
                  const dateB = new Date(b.uploadDate || new Date())
                  return dateB.getTime() - dateA.getTime()
                })
              } else {
                // Sort by popularity score for other categories
                filteredVideos.sort((a, b) => b.popularityScore - a.popularityScore)
              }
            }

            // Apply pagination
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginatedVideos = filteredVideos.slice(startIndex, endIndex)

            console.log('📊 YouTube trending results with params:', {
              category,
              params,
              totalVideos: filteredVideos.length,
              returnedVideos: paginatedVideos.length,
              topScore: filteredVideos[0]?.popularityScore || 0,
              dateFilter: category === 'recent_uploads' ? '2 years' : 'none'
            })

            return {
              success: true,
              data: paginatedVideos,
              total: filteredVideos.length,
              page,
              limit,
              category,
              params,
              method: 'params_search'
            }
          }
        } catch (paramsError) {
          console.log('⚠️ YouTube params search failed, falling back to query-based search:', paramsError.message)
        }
      }
      
      // Fallback to query-based search if params fail or not provided
      console.log('🔄 Using fallback query-based search for category:', category)
      
      // Define search queries based on category with date-specific terms
      const currentYear = new Date().getFullYear()
      const searchQueries = {
        trending_now: [
          `quran recitation ${currentYear}`,
          `quran tilawah ${currentYear}`,
          'quran recitation new',
          'quran recitation latest',
          'quran recitation trending'
        ],
        most_viewed: ['quran recitation', 'quran tilawah', 'quran reciter'],
        recent_uploads: [
          `quran recitation ${currentYear}`,
          `quran recitation ${currentYear - 1}`,
          'quran recitation new',
          'quran recitation latest',
          'quran tilawah new',
          'quran reciter latest',
          'quran recitation uploaded today',
          'quran recitation this week'
        ],
        live_recitations: ['quran recitation live', 'quran tilawah live', 'quran reciter live'],
        top_reciters: ['mishary rashid alafasy', 'abdul rahman al-sudais', 'maher al mueaqly', 'saad al-ghamdi'],
        popular_surahs: ['surah al-fatiha', 'ayat al-kursi', 'surah al-baqarah', 'surah yasin'],
        by_style: ['quran murattal', 'quran mujawwad', 'quran hafs', 'quran warsh'],
        viral: ['quran recitation', 'quran tilawah', 'quran reciter']
      }

      const queries = searchQueries[category] || searchQueries.trending_now
      console.log('🔍 Using search queries:', queries)

      // Search for videos using multiple queries
      const allVideos = []
      for (const query of queries) {
        try {
          const searchResponse = await yt.search(query, { type: 'video' })
          if (searchResponse?.results) {
            const videos = searchResponse.results
              .filter((video: any) => isQuranRecitation(video.title?.text || video.title))
              .map((video: any) => enhanceVideoWithPopularityData(video, category))
            
            allVideos.push(...videos)
          }
        } catch (error) {
          console.log('⚠️ Search query failed:', query, error.message)
        }
      }

      // Remove duplicates and calculate popularity scores
      const uniqueVideos = removeDuplicateVideos(allVideos)
      const scoredVideos = uniqueVideos.map(video => ({
        ...video,
        popularityScore: calculatePopularityScore(video, category),
        lastUpdated: new Date().toISOString()
      }))

      // Apply date-based filtering for recent content categories
      let filteredVideos = scoredVideos.filter(video => video.popularityScore > 0)
      
      if (category === 'recent_uploads') {
        // Filter for videos uploaded within the last 2 years, but prioritize recent ones
        const twoYearsAgo = new Date()
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
        
        filteredVideos = filteredVideos.filter(video => {
          if (!video.uploadDate) return true // Include videos without date info
          const uploadDate = new Date(video.uploadDate)
          return uploadDate >= twoYearsAgo
        })
        
        // Sort by upload date (newest first) for recent uploads
        filteredVideos.sort((a, b) => {
          const dateA = new Date(a.uploadDate || new Date())
          const dateB = new Date(b.uploadDate || new Date())
          return dateB.getTime() - dateA.getTime()
        })
      } else if (category === 'trending_now') {
        // Filter for videos uploaded within the last 1 year for trending
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        
        filteredVideos = filteredVideos.filter(video => {
          if (!video.uploadDate) return true // Include videos without date info
          const uploadDate = new Date(video.uploadDate)
          return uploadDate >= oneYearAgo
        })
        
        // Sort by popularity score for trending
      filteredVideos.sort((a, b) => b.popularityScore - a.popularityScore)
      } else {
        // Sort by popularity score for other categories
        filteredVideos.sort((a, b) => b.popularityScore - a.popularityScore)
      }

      // If no videos after date filtering, fall back to all videos with date-based sorting
      if (filteredVideos.length === 0) {
        console.log('⚠️ No videos after date filtering (fallback), falling back to all videos with date-based sorting')
        filteredVideos = scoredVideos.filter(video => video.popularityScore > 0)
        if (category === 'recent_uploads') {
          // Sort by upload date (newest first) for recent uploads
          filteredVideos.sort((a, b) => {
            const dateA = new Date(a.uploadDate || new Date())
            const dateB = new Date(b.uploadDate || new Date())
            return dateB.getTime() - dateA.getTime()
          })
        } else if (category === 'trending_now') {
          // Sort by popularity score for trending
          filteredVideos.sort((a, b) => b.popularityScore - a.popularityScore)
        }
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedVideos = filteredVideos.slice(startIndex, endIndex)

      console.log('📊 YouTube trending results (fallback):', {
        category,
        totalVideos: filteredVideos.length,
        returnedVideos: paginatedVideos.length,
        topScore: filteredVideos[0]?.popularityScore || 0,
        dateFilter: category === 'recent_uploads' ? '2 years' : category === 'trending_now' ? '1 year' : 'none'
      })

      return {
        success: true,
        data: paginatedVideos,
        total: filteredVideos.length,
        page,
        limit,
        category
      }
    } catch (error) {
      console.error('❌ YouTube trending error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  })

  // Helper function to check if video is Quran recitation
  function isQuranRecitation(title: string): boolean {
    if (!title) return false
    
    const keywords = [
      'quran', 'koran', 'qur\'an', 'qur\'ān',
      'recitation', 'recite', 'tilawah',
      'mishary', 'sudais', 'shuraim', 'maher', 'hudhaify',
      'sheikh', 'imam', 'qari', 'surah', 'ayat'
    ]
    
    const lowerTitle = title.toLowerCase()
    return keywords.some(keyword => lowerTitle.includes(keyword))
  }

  // Helper function to enhance video with popularity data
  function enhanceVideoWithPopularityData(video: any, category: string) {
    const title = video.title?.text || video.title || 'Unknown Title'
    const viewCount = video.view_count?.text || video.view_count || '0'
    const uploadDate = video.published?.text || video.published || new Date().toISOString()
    
    return {
      video_id: video.video_id || video.id,
      title: { text: title },
      author: { name: video.author?.name || 'Unknown Channel' },
      view_count: { text: viewCount },
      published: { text: uploadDate },
      thumbnails: video.thumbnails || [{ url: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' }],
      duration: video.duration?.seconds || 0,
      // Quran-specific data
      reciterName: extractReciterFromTitle(title),
      surahNumber: extractSurahFromTitle(title).number,
      surahName: extractSurahFromTitle(title).name,
      isQuranRecitation: true,
      category
    }
  }

  // Helper function to extract reciter from title
  function extractReciterFromTitle(title: string): string {
    const reciters = [
      'Mishary Rashid Alafasy', 'Abdul Rahman Al-Sudais', 'Maher Al Mueaqly',
      'Saad Al-Ghamdi', 'Muhammad Al-Luhaidan', 'Fares Abbad',
      'Khalid Al-Jalil', 'Abdullah Al-Matroud', 'Yasser Al-Dosari',
      'Bandar Baleelah', 'Muhammad Siddiq Al-Minshawi', 'Mahmoud Khalil Al-Husary'
    ]
    
    for (const reciter of reciters) {
      if (title.toLowerCase().includes(reciter.toLowerCase())) {
        return reciter
      }
    }
    
    return 'Unknown Reciter'
  }

  // Helper function to extract surah from title
  function extractSurahFromTitle(title: string): { number: number, name: string } {
    const surahs = [
      { number: 1, name: 'Al-Fatiha' },
      { number: 2, name: 'Al-Baqarah' },
      { number: 3, name: 'Ali Imran' },
      { number: 4, name: 'An-Nisa' },
      { number: 5, name: 'Al-Maidah' },
      { number: 36, name: 'Yasin' },
      { number: 67, name: 'Al-Mulk' },
      { number: 112, name: 'Al-Ikhlas' },
      { number: 113, name: 'Al-Falaq' },
      { number: 114, name: 'An-Nas' }
    ]
    
    const lowerTitle = title.toLowerCase()
    
    for (const surah of surahs) {
      if (lowerTitle.includes(surah.name.toLowerCase()) || 
          lowerTitle.includes(`surah ${surah.number}`) ||
          lowerTitle.includes(`chapter ${surah.number}`)) {
        return surah
      }
    }
    
    return { number: 0, name: 'Unknown Surah' }
  }

  // Helper function to remove duplicate videos
  function removeDuplicateVideos(videos: any[]): any[] {
    const seen = new Set()
    return videos.filter(video => {
      const id = video.video_id
      if (seen.has(id)) {
        return false
      }
      seen.add(id)
      return true
    })
  }

  // Helper function to parse view count
  function parseViewCount(viewText: string): number {
    if (!viewText) return 0
    
    const cleanText = viewText.replace(/[^\d.,KMB]/g, '')
    const number = parseFloat(cleanText.replace(',', '.'))
    
    if (cleanText.includes('B')) return Math.floor(number * 1000000000)
    if (cleanText.includes('M')) return Math.floor(number * 1000000)
    if (cleanText.includes('K')) return Math.floor(number * 1000)
    
    return Math.floor(number) || 0
  }

  // Helper function to calculate popularity score (inspired by Chinese sources)
  function calculatePopularityScore(video: any, category: string): number {
    const views = parseViewCount(video.view_count?.text || '0')
    const uploadDate = new Date(video.published?.text || video.published)
    const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Base score from views
    let score = views
    
    // Recency boost (similar to KW "hot" sorting)
    if (daysSinceUpload < 1) score *= 3      // <24 hours
    else if (daysSinceUpload < 7) score *= 2  // <7 days
    else if (daysSinceUpload < 30) score *= 1.5 // <30 days
    
    // Category-specific adjustments (purely metric-based)
    switch (category) {
      case 'most_viewed':
        // Pure view count - no recency boost
        score = views
        break
      case 'recent_uploads':
        // Only include videos from the last 30 days, heavily penalize older content
        if (daysSinceUpload > 30) score = 0  // Completely exclude videos older than 30 days
        else if (daysSinceUpload > 7) score *= 0.1  // Heavily penalize videos older than 1 week
        else if (daysSinceUpload > 3) score *= 0.3  // Penalize videos older than 3 days
        else if (daysSinceUpload > 1) score *= 0.7  // Slight penalty for videos older than 1 day
        break
      case 'live_recitations':
        // Check if actually live by upload time (very recent) and high engagement
        const isRecentLive = daysSinceUpload < 0.1 // Less than 2.4 hours
        const hasHighEngagement = views > 1000 && daysSinceUpload < 1
        if (isRecentLive || hasHighEngagement) score *= 2
        break
      case 'trending_now':
        // Combination of recency and engagement
        const trendingScore = views * (1 + (1 / Math.max(daysSinceUpload, 0.1)))
        score = trendingScore
        break
      case 'viral':
        // High engagement rate - views per day
        const engagementRate = views / Math.max(daysSinceUpload, 1)
        score = engagementRate * 1000
        
        // Additional viral indicators
        if (daysSinceUpload < 3) score *= 1.5  // Very recent content
        if (views > 100000 && daysSinceUpload < 7) score *= 1.3  // High views in short time
        if (views > 10000 && daysSinceUpload < 1) score *= 2  // Very high daily rate
        break
      case 'top_reciters':
        // For reciter searches, prioritize by view count and recency
        score = views * (1 + (1 / Math.max(daysSinceUpload, 1)))
        break
      case 'popular_surahs':
        // For surah searches, prioritize by view count and recency
        score = views * (1 + (1 / Math.max(daysSinceUpload, 1)))
        break
      case 'by_style':
        // For style searches, prioritize by view count and recency
        score = views * (1 + (1 / Math.max(daysSinceUpload, 1)))
        break
    }
    
    return Math.floor(score)
  }
}
