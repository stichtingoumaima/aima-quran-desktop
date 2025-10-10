import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { rendererInvoke } from '@common/rendererIpc'
import { formatDuration, parseReadableDate } from './utils'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // YouTube Base64 parameters for different sorting/filtering options
  getParamsForCategory(category) {
    const paramsMap = {
      most_viewed: 'CAMSAhAB', // Most Viewed
      recent_uploads: 'CAISAhAB', // Recent Uploads
      trending_now: 'EgIIAg==', // Trending (This Week)
      live_recitations: 'EgJAAQ==', // Live
    }
    return paramsMap[category] || 'EgIIAg==' // Default to trending
  },

  async getList(id, page = 1, limit = 30) {
    console.log('🏆 Fetching leaderboard:', { id, page, limit })

    try {
      const category = id.replace('youtube__', '')
      const params = this.getParamsForCategory(category)

      const response = await rendererInvoke(WIN_MAIN_RENDERER_EVENT_NAME.youtube_get_trending, {
        category,
        page,
        limit,
        params, // Pass the Base64 params to the YouTube API
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch trending data')
      }

      const trendingData = response.data || []
      const list = trendingData.map((video, index) =>
        this.transformTrendingVideo(video, (page - 1) * limit + index + 1, category),
      )

      this.total = response.total || trendingData.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list,
        total: this.total,
        page: this.page,
        limit: this.limit,
        source: 'youtube',
      }
    } catch (error) {
      console.error('❌ Error fetching YouTube trending data:', error)
      return { list: [], total: 0, page: 1, limit: this.limit, source: 'youtube' }
    }
  },

  transformTrendingVideo(video, rank, category) {
    const title = video.title?.text || 'Unknown Title'
    const channelName = video.author?.name || 'Unknown Channel'
    const uploadDateText = video.published?.text

    return {
      name: title,
      singer: channelName,
      source: 'youtube',
      songmid: `yt_${video.video_id}`,
      albumId: `yt_channel_${video.author?.id || 'unknown'}`,
      interval: formatDuration(video.duration || 0),
      albumName: `${video.view_count?.text || '0 views'} • ${uploadDateText || 'Unknown date'}`,
      img: video.thumbnails?.[0]?.url || '',
      lrc: null,
      types: [{ type: 'mp4', size: '0MB' }],
      _types: { mp4: { size: '0MB' } },
      typeUrl: {},
      youtubeId: video.video_id,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.video_id}`,
      channelName,
      channelId: video.author?.id,
      views: video.view_count?.text,
      uploadDate: parseReadableDate(uploadDateText),
      duration: video.duration || 0,
      reciterName: video.reciterName || 'Unknown Reciter',
      surahNumber: video.surahNumber || 0,
      surahName: video.surahName || 'Unknown Surah',
      isQuranRecitation: true,
      rank,
      category,
      lastUpdated: new Date().toISOString(),
    }
  },

  getBoards() {
    return Promise.resolve({
      list: [
        { id: 'youtube__trending_now', name: 'Trending', bangid: 'trending_now' },
        { id: 'youtube__most_viewed', name: 'Most Viewed', bangid: 'most_viewed' },
        { id: 'youtube__recent_uploads', name: 'Recent Uploads', bangid: 'recent_uploads' },
        { id: 'youtube__live_recitations', name: 'Live Recitations', bangid: 'live_recitations' },
      ],
      source: 'youtube',
    })
  },
}
