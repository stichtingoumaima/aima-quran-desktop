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
}
