import {
  formatDuration,
  extractReciterFromTitle,
  extractSurahFromTitle,
  isQuranRecitation,
  parseReadableDate,
} from './utils'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { rendererInvoke } from '@common/rendererIpc'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  /**
   * Restored for compatibility with the store state.
   */
  sortList: [
    { name: 'sort__recommended', id: 'default' },
    { name: 'sort__most_popular', id: 'popular' },
    { name: 'sort__latest', id: 'newest' },
  ],

  /**
   * Fetches videos from a specified YouTube playlist.
   */
  async getPlaylistVideos(playlistId, page = 1, limit = 30) {
    try {
      const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_playlist, { playlistId })

      if (!response.success) {
        throw new Error(response.error || 'Failed to get YouTube playlist')
      }

      const playlist = response.data
      if (!playlist?.contents) {
        throw new Error('No playlist videos found')
      }

      const videos = playlist.contents
        .map(item => item.playlist_video_renderer)
        .filter(Boolean)


      // For playlists, be more lenient with filtering since playlists are already Quran-focused
      const quranVideos = videos.filter(video => {
        const title = video.title?.runs?.[0]?.text || video.title?.text
        const isQuran = isQuranRecitation(title)

        // If it's clearly a Quran recitation, include it
        if (isQuran) return true

        // For playlists, also include videos that might be Quran-related but don't have obvious keywords
        // This helps with videos that have Arabic titles or non-English descriptions
        if (title && title.trim()) {
          // Include videos with Arabic characters (likely Quran recitations)
          if (/[\u0600-\u06FF]/.test(title)) return true

          // Include videos with common Islamic terms
          const islamicTerms = ['allah', 'islam', 'muslim', 'prayer', 'dua', 'dhikr', 'tasbih', 'ayat', 'verse']
          const lowerTitle = title.toLowerCase()
          if (islamicTerms.some(term => lowerTitle.includes(term))) return true
        }

        return false
      })

      const startIndex = (page - 1) * limit
      const paginatedVideos = quranVideos.slice(startIndex, startIndex + limit)

      const list = paginatedVideos.map(video => this.transformVideoToSong(video, playlist))

      this.total = quranVideos.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      const result = {
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
        },
      }

      return result
    } catch (error) {
      console.error('❌ Error fetching playlist videos:', error)
      throw error
    }
  },

  /**
   * Transforms a raw YouTube video object into the application's song format.
   */
  transformVideoToSong(video, playlist = null) {
    const title = video.title?.runs?.[0]?.text || video.title?.text || 'Unknown Title'
    const reciter = extractReciterFromTitle(title)
    const surah = extractSurahFromTitle(title)
    const duration = video.length_seconds || 0
    const uploadDateText = video.published?.text
    const views = video.view_count?.text || '0 views'

    // Format albumName with views and date like other sources
    const albumName = `${views} • ${uploadDateText || 'Unknown date'}`

    return {
      name: title,
      singer: reciter,
      source: 'youtube',
      songmid: `yt_${video.video_id}`,
      albumId: playlist
        ? `yt_playlist_${playlist.id}`
        : `yt_channel_${video.short_byline_text?.runs?.[0]?.navigation_endpoint?.browse_endpoint?.browse_id || 'unknown'}`,
      interval: formatDuration(duration),
      albumName,
      img: video.thumbnail?.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [{ type: 'mp4', size: '0MB' }],
      _types: { mp4: { size: '0MB' } },
      typeUrl: {},
      youtubeId: video.video_id,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.video_id}`,
      channelName: video.short_byline_text?.runs?.[0]?.text,
      channelId: video.short_byline_text?.runs?.[0]?.navigation_endpoint?.browse_endpoint?.browse_id,
      views,
      uploadDate: parseReadableDate(uploadDateText),
      duration,
      reciterName: reciter,
      surahNumber: surah.number,
      surahName: surah.name,
      isQuranRecitation: true,
      playlistId: playlist?.id,
      playlistTitle: playlist?.header?.title?.text,
    }
  },

  /**
   * Restored for compatibility with the store action.
   * Fetches playlist details.
   */
  getListDetail(playlistId, page = 1, limit = 30) {
    const actualPlaylistId = playlistId.startsWith('yt_playlist_')
      ? playlistId.replace('yt_playlist_', '')
      : playlistId
    return this.getPlaylistVideos(actualPlaylistId, page, limit)
  },

  /**
   * Restored for compatibility with the store action.
   * Provides filter tags.
   */
  getTags() {
    return Promise.resolve({
      tags: [
        {
          name: 'Popular Reciters',
          list: [
            { id: 'Mishary Rashid Alafasy', name: 'Mishary Alafasy', source: 'youtube' },
            { id: 'Abdul Rahman Al-Sudais', name: 'Al-Sudais', source: 'youtube' },
            { id: 'Saad Al-Ghamdi', name: 'Saad Al-Ghamdi', source: 'youtube' },
            { id: 'Maher Al Mueaqly', name: 'Maher Al Mueaqly', source: 'youtube' },
          ],
        },
      ],
      hotTag: [
        { id: 'Mishary Rashid Alafasy', name: 'Mishary Alafasy', source: 'youtube' },
        { id: 'Complete Quran', name: 'Complete Quran', source: 'youtube' },
      ],
      source: 'youtube',
    })
  },

  /**
   * Restored for compatibility with the store action.
   * Fetches the default list, now pointing to a popular search.
   */
  getList(sortId, tagId, page) {
    const query = tagId || 'Complete Quran'
    return this.search(query, page, this.limit)
  },

  /**
   * Searches for Quran playlists.
   */
  async search(query, page = 1, limit = 30) {
    if (!query?.trim()) {
      // Fallback to a default search if the query is empty
      query = 'Quran Recitation'
    }

    try {
      const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_search, {
        query, // Use the original query without modification
        page,
        limit,
      })

      if (!response.success) {
        throw new Error(response.error || 'YouTube playlist search failed')
      }

      // Extract playlists from the new data structure
      const playlists = response.data.playlists || []

      const list = playlists.map(playlist => this.transformPlaylistToSong(playlist))

      this.total = list.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'youtube',
      }
    } catch (error) {
      console.error('❌ YouTube playlist search error:', error)
      throw error
    }
  },

  /**
   * Transforms a raw YouTube playlist object into the application's list item format.
   */
  transformPlaylistToSong(playlist) {
    const playlistId = `yt_playlist_${playlist.playlist_id}`
    return {
      id: playlistId, // This is the key fix - add the id property
      name: playlist.title || 'Unknown Playlist',
      singer: playlist.author?.name || 'YouTube Channel',
      source: 'youtube',
      songmid: playlistId,
      albumId: playlistId,
      interval: '0:00:00', // Duration is not available for playlists in search results
      albumName: playlist.author?.name || 'YouTube Channel',
      img: playlist.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [{ type: 'mp4', size: '0MB' }],
      _types: { mp4: { size: '0MB' } },
      typeUrl: {},
      youtubePlaylistId: playlist.playlist_id,
      videoCount: playlist.video_count?.text || '0',
      isPlaylist: true,
    }
  },
}
