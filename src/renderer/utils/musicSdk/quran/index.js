import { httpFetch } from '../../request'
import reciterSearch from './reciterSearch'
import surahSearch from './surahSearch'
import audioSearch from './audioSearch'
import { formatReciter, formatSurah } from './util'

const quran = {
  _reciterRequestObj: null,
  _reciterPromiseCancelFn: null,
  _audioRequestObj: null,
  _audioPromiseCancelFn: null,
  _surahRequestObj: null,
  _surahPromiseCancelFn: null,
  _accessToken: null,
  _clientId: 'your-client-id', // Replace with actual client ID

  reciterSearch,
  surahSearch,
  audioSearch,


  // Required properties for compatibility with other music sources
  leaderboard: {
    getList: () => Promise.resolve({ list: [], total: 0 }),
    getBoards: () => Promise.resolve({ list: [], total: 0 }),
  },

  // Required properties for songList compatibility
  songList: {
    search: (query, page = 1, limit = 18) => {
      // For Quran, we'll return popular reciters as "playlists"
      return reciterSearch.getPopular(limit).then(reciterResults => {
        const playlistList = []

        if (reciterResults.list && reciterResults.list.length > 0) {
          reciterResults.list.filter(reciter => reciter && reciter.id).forEach(reciter => {
            playlistList.push({
              id: `reciter_${reciter.id}`,
              name: reciter.name || 'Unknown Reciter',
              desc: `Recitations by ${reciter.translated_name || reciter.name || 'Unknown'}`,
              play_count: 0,
              author: reciter.translated_name || reciter.name || 'Unknown',
              img: reciter.avatar_url || 'https://i.ytimg.com/vi/Nnd641CP1k8/maxresdefault.jpg',
              source: 'quran',
              songmid: `reciter_${reciter.id}`,
              types: [],
              _types: {},
              albumId: `reciter_${reciter.id}`,
              meta: {
                type: 'reciter',
                reciterId: reciter.id,
                language: reciter.language_name || '',
                style: reciter.style || '',
                region: reciter.region || '',
              },
            })
          })
        }

        const result = {
          list: playlistList,
          total: playlistList.length,
          page,
          limit,
          source: 'quran',
        }
        return result
      }).catch(error => {
        console.error('❌ Quran playlist search error:', error)
        return {
          list: [],
          total: 0,
          page,
          limit,
          source: 'quran',
        }
      })
    },
    getTags: () => Promise.resolve({ list: [], total: 0 }),
    getList: () => Promise.resolve({ list: [], total: 0 }),
    getListDetail: (id, page = 1, limit = 20) => {
      // Extract reciter ID from the reciter_ prefix
      const reciterId = id.replace('reciter_', '')

      // Get all surahs and format them as music items for this reciter
      return quran.getSurahList().then(surahs => {
        // Apply pagination
        const startIndex = (page - 1) * limit
        const paginatedSurahs = surahs.slice(startIndex, startIndex + limit)

        const surahList = paginatedSurahs.filter(surah => surah && surah.id).map(surah => ({
          id: `surah_${surah.id}_${reciterId}`,
          name: surah.name || 'Unknown Surah',
          singer: 'Quran',
          albumName: `Surah ${surah.name || 'Unknown'}`,
          interval: '00:00',
          source: 'quran',
          songmid: `surah_${surah.id}_${reciterId}`,
          img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNEE5MEUyIi8+Cjx0ZXh0IHg9Ijc1IiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UTwvdGV4dD4KPC9zdmc+',
          types: [
            { type: '128k', size: '128k', hash: '' },
            { type: '320k', size: '320k', hash: '' },
          ],
          _types: {
            '128k': { size: '128k', hash: '' },
            '320k': { size: '320k', hash: '' },
          },
          albumId: `surah_${surah.id}`,
          meta: {
            albumName: `Surah ${surah.name || 'Unknown'}`,
            pic: 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=Q',
            year: '',
            type: 'surah',
            surahId: surah.id,
            reciterId,
            nameArabic: surah.nameArabic || '',
            versesCount: surah.versesCount || 0,
            revelationPlace: surah.revelationPlace || '',
          },
        }))

        const result = {
          list: surahList,
          total: surahs.length,
          page,
          limit,
          source: 'quran',
          info: {
            id,
            name: `Reciter ${reciterId}`,
            img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNEE5MEUyIi8+Cjx0ZXh0IHg9Ijc1IiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UTwvdGV4dD4KPC9zdmc+',
            desc: `All surahs by reciter ${reciterId}`,
            play_count: 0,
            author: `Reciter ${reciterId}`,
            source: 'quran',
          },
        }

        return result
      }).catch(error => {
        console.error('❌ Quran getListDetail error:', error)
        return {
          list: [],
          total: 0,
          page,
          limit,
          source: 'quran',
          info: {
            id,
            name: `Reciter ${reciterId}`,
            img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNEE5MEUyIi8+Cjx0ZXh0IHg9Ijc1IiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UTwvdGV4dD4KPC9zdmc+',
            desc: `All surahs by reciter ${reciterId}`,
            play_count: 0,
            author: `Reciter ${reciterId}`,
            source: 'quran',
          },
        }
      })
    },
    sortList: [],
  },

  // Additional required properties
  tipSearch: {
    search: () => Promise.resolve({ list: [], total: 0 }),
  },
  hotSearch: {
    getList: () => Promise.resolve({
      list: [
        'Al-Fatiha',
        'Al-Baqarah',
        'Yasin',
        'Ar-Rahman',
        'Al-Mulk',
        'Abdul Basit',
        'Mishary Rashid',
        'Saad Al-Ghamdi',
        'Sudais',
        'Shuraim',
        'Maher Al-Muaiqly',
        'Al-Ajmi',
        'Al-Afasy',
        'Al-Husary',
        'Al-Minshawi',
        'Quran Recitation',
        'Holy Quran',
        'Arabic Recitation',
        'Tilawat',
        'Quran Audio',
      ],
    }),
  },
  comment: {
    getList: () => Promise.resolve({ list: [], total: 0 }),
  },

  // Get reciter information
  getReciterInfo(reciterInfo) {
    return this.getReciterDetails(reciterInfo).then(info => {
      reciterInfo.name = info.reciter_name
      reciterInfo.language = info.language_name
      reciterInfo.style = info.style
      reciterInfo.region = info.region
      reciterInfo.translated_name = info.translated_name
      return reciterInfo
    })
  },

  // Get surah information
  getSurahInfo(surahInfo) {
    return this.getSurahDetails(surahInfo).then(info => {
      surahInfo.name = info.name_simple
      surahInfo.nameArabic = info.name_arabic
      surahInfo.versesCount = info.verses_count
      surahInfo.revelationOrder = info.revelation_order
      surahInfo.revelationPlace = info.revelation_place
      surahInfo.nameComplex = info.name_complex
      return surahInfo
    })
  },

  // Get audio URL for specific surah and reciter
  getAudioUrl(surahInfo, reciterId, quality = '128k') {
    return this.getAudioStream(surahInfo, reciterId, quality)
  },

  // Get verse-by-verse audio
  getVerseAudio(surahId, verseId, reciterId, quality = '128k') {
    return this.getVerseStream(surahId, verseId, reciterId, quality)
  },

  // Get reciter details from API
  getReciterDetails(reciterInfo) {
    if (this._reciterRequestObj) this._reciterRequestObj.cancelHttp()
    this._reciterRequestObj = httpFetch(`https://api.quran.com/api/v4/resources/recitations/${reciterInfo.id}`)
    return this._reciterRequestObj.promise.then(({ body }) => {
      return body.recitation ? body.recitation : Promise.reject(new Error('Reciter not found'))
    })
  },

  // Get surah details from API
  getSurahDetails(surahInfo) {
    if (this._surahRequestObj) this._surahRequestObj.cancelHttp()
    this._surahRequestObj = httpFetch(`https://api.quran.com/api/v4/chapters/${surahInfo.id}`)
    return this._surahRequestObj.promise.then(({ body }) => {
      return body.chapter ? body.chapter : Promise.reject(new Error('Surah not found'))
    })
  },

  // Get audio stream for surah
  getAudioStream(surahInfo, reciterId, quality) {
    // Create a unique key for this request to avoid unnecessary cancellations
    const requestKey = `${surahInfo.id}_${reciterId}_${quality}`

    // Only cancel if it's a different request
    if (this._audioRequestObj && this._currentRequestKey !== requestKey) {
      this._audioRequestObj.cancelHttp()
    }

    // If we already have a request for the same surah/reciter, return it
    if (this._audioRequestObj && this._currentRequestKey === requestKey) {
      return this._audioRequestObj.promise
    }

    // Use the correct Quran.com API endpoint (parameters swapped)
    const url = `https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahInfo.id}?segments=true`
    this._currentRequestKey = requestKey
    this._audioRequestObj = httpFetch(url)
    return this._audioRequestObj.promise.then(({ body }) => {
      if (body.audio_file) {
        const audioFile = body.audio_file

        // Calculate duration from timestamps if available
        let duration = '00:00'
        if (audioFile.timestamps && audioFile.timestamps.length > 0) {
          const lastVerse = audioFile.timestamps[audioFile.timestamps.length - 1]
          const totalMs = lastVerse.timestamp_to
          const totalSeconds = Math.floor(totalMs / 1000)
          const minutes = Math.floor(totalSeconds / 60)
          const seconds = totalSeconds % 60
          duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }

        return {
          url: audioFile.audio_url,
          format: audioFile.format,
          duration,
          segments: audioFile.timestamps || [],
          fileSize: audioFile.file_size,
          timestamps: audioFile.timestamps || [],
        }
      }
      return Promise.reject(new Error('Audio not found'))
    })
  },

  // Get verse stream (individual verse audio)
  getVerseStream(surahId, verseId, reciterId, quality) {
    if (this._audioRequestObj) this._audioRequestObj.cancelHttp()
    this._audioRequestObj = httpFetch(`https://api.quran.com/api/v4/verses/${surahId}:${verseId}?recitation=${reciterId}`)
    return this._audioRequestObj.promise.then(({ body }) => {
      if (body.audio && body.audio.url) {
        return {
          url: body.audio.url,
          format: body.audio.format || 'mp3',
          duration: body.audio.duration,
        }
      }
      return Promise.reject(new Error('Verse audio not found'))
    })
  },

  // Get verse timing from surah audio (for verse-by-verse playback)
  getVerseTiming(surahId, verseId, reciterId) {
    return this.getAudioStream({ id: surahId }, reciterId, 'mp3').then(audioInfo => {
      if (audioInfo.timestamps && audioInfo.timestamps.length > 0) {
        const verseTiming = audioInfo.timestamps.find(t => t.verse_key === `${surahId}:${verseId}`)
        if (verseTiming) {
          return {
            url: audioInfo.url,
            startTime: verseTiming.timestamp_from,
            endTime: verseTiming.timestamp_to,
            duration: verseTiming.duration,
            segments: verseTiming.segments,
          }
        }
      }
      return Promise.reject(new Error('Verse timing not found'))
    })
  },

  // Get music info for playback (required by music player)
  getMusic(musicInfo) {
    // Extract surah and reciter info from the music item
    const { meta } = musicInfo

    // Try to extract surahId from songmid if meta is missing
    let surahId = meta?.surahId
    let reciterId = meta?.reciterId || '1' // Default to Abdul Basit

    if (!surahId && musicInfo.songmid) {
      // Extract surah ID from songmid (e.g., "surah_1_2" -> "1")
      const match = musicInfo.songmid.match(/surah_(\d+)/)
      if (match) {
        surahId = match[1]
      }
    }

    // Also extract reciterId from songmid if meta is missing
    if (!meta?.reciterId && musicInfo.songmid) {
      // Extract reciter ID from songmid (e.g., "surah_3_quran_11" -> "11")
      const reciterMatch = musicInfo.songmid.match(/surah_\d+_quran_(\d+)/)
      if (reciterMatch) {
        reciterId = reciterMatch[1]
      } else {
        // Try alternative pattern (e.g., "surah_1_2" -> "2")
        const altMatch = musicInfo.songmid.match(/surah_\d+_(\d+)/)
        if (altMatch) {
          reciterId = altMatch[1]
        }
      }
    }

    if (!surahId) {
      return Promise.reject(new Error('Invalid Quran music info'))
    }

    // Get the audio URL for this surah and reciter
    return this.getAudioStream({ id: surahId }, reciterId, '128k').then(audioInfo => {
      // Return the music info with the audio URL
      const finalMusicInfo = {
        ...musicInfo,
        url: audioInfo.url,
        interval: audioInfo.duration || '00:00',
        meta: {
          songId: musicInfo.songmid,
          albumName: musicInfo.albumName,
          picUrl: musicInfo.img,
          url: audioInfo.url,
          format: audioInfo.format,
          duration: audioInfo.duration,
          surahId,
          reciterId,
        },
      }


      // Return the format expected by the music player
      return {
        url: finalMusicInfo.url,
        type: '128k', // Default quality
      }
    }).catch(error => {
      console.error('❌ Error getting Quran audio:', error)
      return Promise.reject(error)
    })
  },

  // Get music URL (alias for getMusic for compatibility)
  getMusicUrl(musicInfo) {
    const promise = quran.getMusic(musicInfo)
    return {
      promise,
      cancelHttp: () => {
        // Cancel any ongoing requests if needed
        if (quran._audioRequestObj) {
          quran._audioRequestObj.cancelHttp()
        }
      },
    }
  },

  // Get lyrics (Quran doesn't have traditional lyrics, return empty)
  getLyric(musicInfo) {
    return Promise.resolve({
      lyric: '',
      tlyric: '',
      lyricUrl: '',
      tlyricUrl: '',
    })
  },

  // Get all surahs
  getSurahList() {
    return httpFetch('https://api.quran.com/api/v4/chapters').promise.then(({ body }) => {
      if (body.chapters) {
        return body.chapters.map(surah => formatSurah(surah))
      }
      return Promise.reject(new Error('Surahs not found'))
    })
  },

  // Get all reciters
  getReciterList() {
    return httpFetch('https://api.quran.com/api/v4/resources/recitations').promise.then(({ body }) => {
      return body.recitations ? body.recitations.map(reciter => formatReciter(reciter)) : Promise.reject(new Error('Reciters not found'))
    })
  },

  // Get verses of a surah
  getSurahVerses(surahId, translationId = null) {
    const url = translationId
      ? `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?translations=${translationId}`
      : `https://api.quran.com/api/v4/verses/by_chapter/${surahId}`

    return httpFetch(url).promise.then(({ body }) => {
      return body.verses ? body.verses : Promise.reject(new Error('Verses not found'))
    })
  },

  // Get translations
  getTranslations() {
    return httpFetch('https://api.quran.com/api/v4/resources/translations').promise.then(({ body }) => {
      return body.translations ? body.translations : Promise.reject(new Error('Translations not found'))
    })
  },

  // Get tafsir (commentary)
  getTafsir(verseId, tafsirId = 1) {
    return httpFetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${verseId}`).promise.then(({ body }) => {
      return body.tafsir ? body.tafsir : Promise.reject(new Error('Tafsir not found'))
    })
  },

  // Search across Quran text
  searchQuran(query, language = 'ar', page = 1, limit = 20) {
    return httpFetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&language=${language}&page=${page}&size=${limit}`).promise.then(({ body }) => {
      return body.search ? body.search : Promise.reject(new Error('Search failed'))
    })
  },

  // Music search interface for compatibility
  musicSearch: {
    search(query, page = 1, limit = 30) {
      // For Quran, we'll search for surahs and format them as music items
      return surahSearch.search(query, page, limit).then(surahResults => {
        const musicList = []

        if (surahResults.list && surahResults.list.length > 0) {
          surahResults.list.forEach(surah => {
            musicList.push({
              id: `surah_${surah.id}`,
              name: surah.name_simple,
              singer: 'Quran',
              albumName: `Surah ${surah.id}`,
              interval: '00:00',
              source: 'quran',
              meta: {
                albumName: `Surah ${surah.id}`,
                pic: '',
                year: '',
                type: 'surah',
                surahId: surah.id,
                reciterId: '1', // Default to reciter ID 1 (Abdul Basit)
                nameArabic: surah.name_arabic,
                versesCount: surah.verses_count,
                revelationPlace: surah.revelation_place,
              },
            })
          })
        }

        return {
          list: musicList,
          total: musicList.length,
          page,
          limit,
          source: 'quran',
        }
      }).catch(error => {
        console.error('Quran search error:', error)
        return {
          list: [],
          total: 0,
          page,
          limit,
          source: 'quran',
        }
      })
    },
  },

  // Get all surahs for a specific reciter
  getReciterSurahs(reciterId, page = 1, limit = 30) {
    return this.getSurahList().then(surahs => {
      const surahList = surahs.map(surah => ({
        id: `surah_${surah.id}_${reciterId}`,
        name: surah.name_simple,
        singer: 'Quran',
        albumName: `Surah ${surah.id}`,
        interval: '00:00',
        source: 'quran',
        meta: {
          albumName: `Surah ${surah.id}`,
          pic: '',
          year: '',
          type: 'surah',
          surahId: surah.id,
          reciterId,
          nameArabic: surah.name_arabic,
          versesCount: surah.verses_count,
          revelationPlace: surah.revelation_place,
        },
      }))

      return {
        list: surahList,
        total: surahList.length,
        page,
        limit,
        source: 'quran',
      }
    }).catch(error => {
      console.error('Get reciter surahs error:', error)
      return {
        list: [],
        total: 0,
        page,
        limit,
        source: 'quran',
      }
    })
  },
}

export default quran
