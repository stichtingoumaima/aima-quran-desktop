import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'
import { dnsLookup } from '../utils'
import { formatDuration, formatFileSize } from './utils'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get all available reciters from Quran.com API
  getReciters(locale = 'en') {
    console.log('🌐 Fetching reciters from API...')
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters?locale=${locale}&fields=profile_picture,cover_image,bio`)
    return requestObj.promise.then(({ body }) => {
      console.log('📡 API Response received:', body)
      if (!body || !body.reciters || !Array.isArray(body.reciters)) {
        console.error('❌ Invalid API response structure:', body)
        return Promise.reject(new Error('Failed to fetch reciters'))
      }
      console.log('✅ Found reciters:', body.reciters.length)
      return body.reciters
    }).catch(error => {
      console.error('❌ Error fetching reciters:', error)
      return Promise.reject(new Error('Failed to fetch reciters'))
    })
  },

  // Get all 114 chapters (surahs) of the Quran
  getChapters(language = 'en') {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/chapters?language=${language}`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.chapters || !Array.isArray(body.chapters)) {
        return Promise.reject(new Error('Failed to fetch chapters'))
      }
      return body.chapters
    }).catch(error => {
      console.error('Error fetching chapters:', error)
      return Promise.reject(new Error('Failed to fetch chapters'))
    })
  },


  // Transform reciters to music SDK format (as playlists)
  handleReciterResult(reciters) {
    if (!reciters) return []

    return reciters.map(reciter => ({
      name: reciter.translatedName?.name || reciter.name || 'Unknown Reciter',
      singer: reciter.name || 'Unknown Reciter',
      source: 'quran',
      id: `reciter_${reciter.id || 'unknown'}`, // This is used by toDetail() for navigation
      songmid: `reciter_${reciter.id || 'unknown'}`,
      albumId: `reciter_${reciter.id || 'unknown'}`,
      interval: '0:00', // Reciters don't have duration
      albumName: `${reciter.style?.name || 'Recitation'} - ${reciter.qirat?.name || 'Hafs'}`,
      img: reciter.profilePicture || reciter.coverImage || '',
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' }, // All recitations are MP3
      ],
      _types: {
        mp3: { size: '0MB' },
      },
      typeUrl: {},
      // Quran-specific data
      reciterId: reciter.id || 'unknown',
      reciterName: reciter.name || 'Unknown Reciter',
      reciterPic: reciter.profilePicture || '',
      recitationStyle: reciter.recitationStyle || 'Unknown',
      qirat: reciter.qirat?.name || 'Unknown',
      style: reciter.style?.name || 'Unknown',
      bio: reciter.bio || '',
      relativePath: reciter.relativePath || '',
      isReciter: true, // Flag to identify this as a reciter
    }))
  },

  // Transform chapters to music SDK format (as songs)
  handleResult(chapters, reciterInfo = null, audioData = []) {
    if (!chapters) return []

    console.log('📖 Sample chapter data:', chapters[0]) // Debug: see actual chapter structure
    console.log('🎵 Audio data available:', audioData.length, 'items')

    return chapters.map((chapter, index) => {
      const audio = audioData[index] || null
      console.log(`🔍 Raw audio data for chapter ${chapter.id}:`, audio)
      const rawDuration = audio?.duration
      console.log(`🔍 Raw duration value: ${rawDuration} (type: ${typeof rawDuration})`)

      // Check if duration is in milliseconds (typical for audio APIs)
      let durationInSeconds = rawDuration
      if (rawDuration && rawDuration > 10000) {
        // If duration is very large, it's likely in milliseconds
        durationInSeconds = rawDuration / 1000
        console.log(`🔧 Converting milliseconds to seconds: ${rawDuration}ms → ${durationInSeconds}s`)
      }

      const duration = rawDuration ? formatDuration(durationInSeconds) : '0:00:00'
      const fileSize = audio?.file_size ? formatFileSize(audio.file_size) : '0MB'
      const audioUrl = audio?.audio_url || null

      console.log(`🎵 Chapter ${chapter.id}: raw=${rawDuration}, converted=${durationInSeconds}s, formatted=${duration}, size=${fileSize}, hasAudio=${!!audioUrl}`)

      return {
        name: chapter.translated_name?.name || chapter.name_complex || chapter.name_simple || 'Unknown Chapter',
        singer: reciterInfo?.name || 'Quran Recitation',
        source: 'quran',
        songmid: `chapter_${chapter.id || 'unknown'}_${reciterInfo?.id || 'default'}`,
        albumId: `chapter_${chapter.id || 'unknown'}`,
        interval: duration,
        albumName: `Surah ${chapter.name_complex || chapter.name_simple || 'Unknown'}`,
        img: reciterInfo?.profilePicture || '',
        lrc: null,
        types: [
          { type: 'mp3', size: fileSize },
        ],
        _types: {
          mp3: { size: fileSize },
        },
        typeUrl: {},
        // Quran-specific data
        chapterId: chapter.id || 'unknown',
        chapterName: chapter.name_complex || chapter.name_simple || 'Unknown',
        chapterNameArabic: chapter.name_arabic || '',
        versesCount: chapter.verses_count || 0,
        revelationPlace: chapter.revelation_place || 'Unknown',
        revelationOrder: chapter.revelation_order || 0,
        pages: chapter.pages || [],
        reciterId: reciterInfo?.id,
        reciterName: reciterInfo?.name,
        reciterPic: reciterInfo?.profilePicture,
        isChapter: true, // Flag to identify this as a chapter
        audioUrl,
        duration: audio?.duration || 0,
        verseTimings: audio?.verse_timings || null,
      }
    })
  },

  // Get chapters for a specific reciter (acts as song list)
  async getChaptersForReciter(reciterId, reciterInfo = null, page = 1, limit = 30) {
    try {
      const chapters = await this.getChapters()

      // Apply pagination to chapters first
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedChapters = chapters.slice(startIndex, endIndex)

      // Fetch audio data for each chapter
      const audioPromises = paginatedChapters.map(chapter =>
        this.getChapterAudio(reciterId, chapter.id),
      )
      const audioData = await Promise.all(audioPromises)

      // Transform chapters with audio data
      const list = this.handleResult(paginatedChapters, reciterInfo, audioData)

      this.total = chapters.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'quran',
      }
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Search chapters (acts as song search)
  search(str, page = 1, limit, retryNum = 0) {
    console.log('📚 Quran songList.search called:', { str, page, limit, retryNum })
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    // For playlist mode, show reciters instead of chapters
    console.log('🎵 Showing reciters for playlist mode')
    return this.getReciters().then(reciters => {
      console.log('📋 Got reciters from API:', reciters.length, reciters.slice(0, 2))
      // Filter reciters based on search string
      let filteredReciters = reciters
      if (str && str.trim()) {
        const searchTerm = str.toLowerCase().trim()
        console.log('🔍 Filtering reciters by:', searchTerm)
        filteredReciters = reciters.filter(reciter =>
          (reciter.name && reciter.name.toLowerCase().includes(searchTerm)) ||
          (reciter.translatedName?.name && reciter.translatedName.name.toLowerCase().includes(searchTerm)) ||
          (reciter.style?.name && reciter.style.name.toLowerCase().includes(searchTerm)) ||
          (reciter.qirat?.name && reciter.qirat.name.toLowerCase().includes(searchTerm)),
        )
        console.log('🎯 Filtered reciters:', filteredReciters.length)
      }

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedReciters = filteredReciters.slice(startIndex, endIndex)

      const list = this.handleReciterResult(paginatedReciters)
      console.log('🎯 Processed reciters list:', list.length, list.slice(0, 2))

      this.total = filteredReciters.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      const result = {
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'quran',
      }
      console.log('📤 Returning reciters result:', result)
      return result
    })
  },

  formatDuration(seconds) {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  formatFileSize(bytes) {
    if (!bytes) return '0MB'
    const mb = (bytes / (1024 * 1024)).toFixed(1)
    return `${mb}MB`
  },

  // Add missing methods required by the interface
  getTags() {
    return Promise.resolve([])
  },

  getList() {
    return this.search('', 1, this.limit)
  },

  // Get audio data for a specific chapter and reciter
  getChapterAudio(reciterId, chapterId) {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=false`, {
      method: 'get',
      headers,
      timeout,
      lookup: dnsLookup,
      family: 4,
    })

    return requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode === 429) return Promise.reject(new Error(requestMsg.tooManyRequests))
      if (!body || !body.audio_files || body.audio_files.length === 0) {
        return null // No audio available for this chapter
      }
      return body.audio_files[0]
    }).catch(error => {
      console.warn(`⚠️ No audio found for reciter ${reciterId}, chapter ${chapterId}:`, error.message)
      return null
    })
  },

  // Get all surahs (chapters) for a specific reciter
  getListDetail(reciterId, page = 1, limit = 30) {
    console.log('📖 Quran getListDetail called:', { reciterId, page, limit })

    // Extract reciter ID from the format "reciter_123"
    const actualReciterId = reciterId.replace('reciter_', '')
    console.log('🎯 Extracted reciter ID:', actualReciterId)

    return this.getChapters().then(chapters => {
      console.log('📚 Got chapters:', chapters.length)

      // Get reciter info to include in the result
      return this.getReciters().then(reciters => {
        const reciter = reciters.find(r => r.id.toString() === actualReciterId)
        console.log('🎤 Found reciter:', reciter?.name || 'Unknown')

        // Apply pagination to chapters
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedChapters = chapters.slice(startIndex, endIndex)

        // Fetch audio data for each chapter to get duration
        const audioPromises = paginatedChapters.map(chapter =>
          this.getChapterAudio(actualReciterId, chapter.id),
        )

        return Promise.all(audioPromises).then(audioData => {
          // Transform chapters to song format with reciter info and audio data
          const list = this.handleResult(paginatedChapters, reciter, audioData)
          console.log('🎵 Processed chapters list:', list.length)

          const result = {
            list,
            allPage: Math.ceil(chapters.length / limit),
            limit,
            total: chapters.length,
            source: 'quran',
            info: {
              name: reciter?.translatedName?.name || reciter?.name || 'Unknown Reciter',
              author: reciter?.name || 'Unknown Reciter',
              desc: `Complete Quran recitation by ${reciter?.name || 'Unknown Reciter'}`,
              img: reciter?.profilePicture || reciter?.coverImage || '',
              play_count: null,
              total: chapters.length,
            },
          }
          console.log('📤 Returning chapters result:', result)
          return result
        })
      })
    }).catch(error => {
      console.error('❌ Error in getListDetail:', error)
      return Promise.reject(error)
    })
  },

  sortList: [
    { name: 'Default', id: 'default' },
  ],
}
