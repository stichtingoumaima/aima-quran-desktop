import { httpFetch } from '../../request'
import { getReciterImage } from './utils'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get fallback image for reciters when Quran.com doesn't provide images
  getReciterFallbackImage(reciterName) {
    if (!reciterName) return 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center'

    // Map popular reciters to specific images
    const reciterImages = {
      'Yasser Ad Dussary': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Abu Bakr al-Shatri': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Sa\'ud ash-Shuraim': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Mishari Rashid al-`Afasy': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'AbdulBaset AbdulSamad': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Hani ar-Rifai': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Khalifah Al Tunaiji': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Mohamed Siddiq al-Minshawi': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Abdur-Rahman as-Sudais': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
      'Mahmoud Khalil Al-Husary': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center',
    }

    return reciterImages[reciterName] || 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&h=300&fit=crop&crop=center'
  },

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

  // Search verses in the Quran
  searchVerses(query, page = 1, limit = 30, language = 'en', translations = '131', mushaf = 4) {
    console.log('🔍 Searching verses for:', query)
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/search?q=${encodeURIComponent(query)}&size=${limit}&page=${page}&language=${language}&translations=${translations}&mushaf=${mushaf}&fields=text_uthmani,text_imlaei_simple`)
    return requestObj.promise.then(({ body }) => {
      console.log('📡 Verse search API response:', body)
      if (!body || !body.result) {
        console.error('❌ No body or result in verse search response:', body)
        return Promise.reject(new Error('Search failed'))
      }
      return body
    }).catch(error => {
      console.error('❌ Verse search error:', error)
      return Promise.reject(error)
    })
  },

  // Get verses by chapter
  getVersesByChapter(chapterId, page = 1, limit = 30, translations = '131', mushaf = 4) {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/verses/by_chapter/${chapterId}?words=true&translations=${translations}&mushaf=${mushaf}&per_page=${limit}&page=${page}&word_translation_language=en&translation_fields=resource_name,language_id&word_fields=verse_key,verse_id,page_number,location,text_uthmani,text_imlaei_simple,qpc_uthmani_hafs`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.verses) {
        return Promise.reject(new Error('Failed to fetch verses'))
      }
      return body
    })
  },

  // Transform reciters to music SDK format (as playlists)
  handleReciterResult(reciters) {
    if (!reciters) return []

    return reciters.map(reciter => {
      const reciterName = reciter.translatedName?.name || reciter.name || 'Unknown Reciter'
      const styleName = reciter.style?.name || 'Recitation'
      const qiratName = reciter.qirat?.name || 'Hafs'

      // Create a unique identifier that includes style information
      const uniqueId = `${reciter.id}_${styleName.toLowerCase().replace(/\s+/g, '_')}`

      // Create a more descriptive name that includes the recitation style
      const displayName = styleName !== 'Recitation'
        ? `${reciterName} (${styleName})`
        : reciterName

      return {
        name: displayName,
        singer: reciterName,
        source: 'quran',
        songmid: `reciter_${uniqueId}`,
        albumId: `reciter_${uniqueId}`,
        interval: '0:00', // Reciters don't have duration
        albumName: `${styleName} - ${qiratName}`,
        img: getReciterImage(reciter),
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
        reciterName,
        reciterPic: reciter.profilePicture || '',
        recitationStyle: reciter.recitationStyle || styleName,
        qirat: qiratName,
        style: styleName,
        bio: reciter.bio || '',
        relativePath: reciter.relativePath || '',
        isReciter: true, // Flag to identify this as a reciter
      }
    })
  },

  // Transform search results to music SDK format
  handleSearchResult(searchData) {
    console.log('🔄 Processing search results:', searchData)
    if (!searchData || !searchData.result || !searchData.result.verses) {
      console.log('❌ Invalid search data structure:', searchData)
      return []
    }

    console.log('📝 Found verses:', searchData.result.verses.length)
    return searchData.result.verses.map(verse => ({
      name: verse.text,
      singer: 'Quran',
      source: 'quran',
      songmid: `verse_${verse.verseKey || 'unknown'}`,
      albumId: `chapter_${verse.verseKey ? verse.verseKey.split(':')[0] : 'unknown'}`,
      interval: '0:00',
      albumName: `Surah ${verse.verseKey ? verse.verseKey.split(':')[0] : 'unknown'}`,
      img: '',
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' },
      ],
      _types: {
        mp3: { size: '0MB' },
      },
      typeUrl: {},
      // Quran-specific data
      verseKey: verse.verseKey,
      verseText: verse.text,
      translations: verse.translations || [],
      isVerse: true,
    }))
  },

  // Transform chapter verses to music SDK format
  handleChapterResult(chapterData, reciterId = null) {
    if (!chapterData || !chapterData.verses) return []

    return chapterData.verses.map(verse => ({
      name: verse.textUthmani || verse.textImlaeiSimple,
      singer: 'Quran Recitation',
      source: 'quran',
      songmid: `verse_${verse.verseKey}_${reciterId || 'default'}`,
      albumId: `chapter_${verse.chapterId}`,
      interval: '0:00',
      albumName: `Surah ${verse.chapterId}`,
      img: '',
      lrc: null,
      types: [
        { type: 'mp3', size: '0MB' },
      ],
      _types: {
        mp3: { size: '0MB' },
      },
      typeUrl: {},
      // Quran-specific data
      verseKey: verse.verseKey,
      verseNumber: verse.verseNumber,
      chapterId: verse.chapterId,
      verseText: verse.textUthmani || verse.textImlaeiSimple,
      translations: verse.translations || [],
      words: verse.words || [],
      reciterId,
      isVerse: true,
    }))
  },

  // Main search method
  search(str, page = 1, limit, retryNum = 0) {
    console.log('🎵 Quran musicSearch.search called:', { str, page, limit, retryNum })
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    if (limit == null) limit = this.limit

    // If search string is empty, return reciters (as playlists)
    if (!str || !str.trim()) {
      console.log('🕌 No search string - returning reciters')
      // Return reciters as playlists when no search term
      return this.getReciters().then(reciters => {
        console.log('📋 Got reciters from API:', reciters.length, reciters.slice(0, 2))
        // Apply pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedReciters = reciters.slice(startIndex, endIndex)

        const list = this.handleReciterResult(paginatedReciters)
        console.log('🎯 Processed reciters list:', list.length, list.slice(0, 2))

        this.total = reciters.length
        this.page = page
        this.allPage = Math.ceil(this.total / limit)

        const result = {
          list,
          allPage: this.allPage,
          limit: this.limit,
          total: this.total,
          source: 'quran',
        }
        console.log('📤 Returning result:', result)
        return result
      })
    }

    console.log('🔍 Searching verses for text:', str)
    return this.searchVerses(str, page, limit).then(searchData => {
      const list = this.handleSearchResult(searchData)
      console.log('📊 Processed verse list:', list.length)

      this.total = searchData.pagination?.totalRecords || 0
      this.page = page
      this.allPage = searchData.pagination?.totalPages || 0

      const result = {
        list,
        allPage: this.allPage,
        limit: this.limit,
        total: this.total,
        source: 'quran',
      }
      console.log('📤 Returning verse search result:', result)
      return result
    }).catch(error => {
      console.error('❌ Quran verse search error:', error)
      return this.search(str, page, limit, retryNum)
    })
  },
}
