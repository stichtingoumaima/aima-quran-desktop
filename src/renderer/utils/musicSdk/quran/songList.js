import { httpFetch } from '../../request'

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

  // Get audio data for a specific reciter and chapter
  getChapterAudio(reciterId, chapterId, segments = true) {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=${segments}`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.audioFiles || body.audioFiles.length === 0) {
        return Promise.reject(new Error('No audio found for this chapter'))
      }
      return body.audioFiles[0] // Return the first audio file
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
  handleResult(chapters, reciterInfo = null) {
    if (!chapters) return []

    console.log('📖 Sample chapter data:', chapters[0]) // Debug: see actual chapter structure

    return chapters.map(chapter => ({
      name: chapter.translated_name?.name || chapter.name_complex || chapter.name_simple || 'Unknown Chapter',
      singer: reciterInfo?.name || 'Quran Recitation',
      source: 'quran',
      songmid: `chapter_${chapter.id || 'unknown'}_${reciterInfo?.id || 'default'}`,
      albumId: `chapter_${chapter.id || 'unknown'}`,
      interval: '0:00', // Will be updated when audio data is fetched
      albumName: `Surah ${chapter.name_complex || chapter.name_simple || 'Unknown'}`,
      img: reciterInfo?.profilePicture || '',
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' },
      ],
      _types: {
        mp3: { size: '0MB' },
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
      audioUrl: null, // Will be populated when audio is fetched
      duration: null,
      verseTimings: null,
    }))
  },

  // Get chapters for a specific reciter (acts as song list)
  async getChaptersForReciter(reciterId, reciterInfo = null, page = 1, limit = 30) {
    try {
      const chapters = await this.getChapters()
      const list = this.handleResult(chapters, reciterInfo)

      // Apply pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedList = list.slice(startIndex, endIndex)

      // Fetch audio data for each chapter (in parallel, but limit concurrency)
      const audioPromises = paginatedList.map(async(chapter) => {
        try {
          const audioData = await this.getChapterAudio(reciterId, chapter.chapterId)
          return {
            ...chapter,
            audioUrl: audioData.audioUrl,
            duration: audioData.duration,
            interval: this.formatDuration(audioData.duration),
            verseTimings: audioData.verseTimings,
            types: [
              { type: 'mp3', size: this.formatFileSize(audioData.fileSize) },
            ],
            _types: {
              mp3: { size: this.formatFileSize(audioData.fileSize) },
            },
          }
        } catch (error) {
          console.warn(`Failed to fetch audio for chapter ${chapter.chapterId}:`, error)
          return chapter // Return chapter without audio data
        }
      })

      const chaptersWithAudio = await Promise.all(audioPromises)

      this.total = chapters.length
      this.page = page
      this.allPage = Math.ceil(this.total / limit)

      return {
        list: chaptersWithAudio,
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

        // Transform chapters to song format with reciter info
        const list = this.handleResult(paginatedChapters, reciter)
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
    }).catch(error => {
      console.error('❌ Error in getListDetail:', error)
      return Promise.reject(error)
    })
  },

  sortList: [
    { name: 'Default', id: 'default' },
  ],
}
