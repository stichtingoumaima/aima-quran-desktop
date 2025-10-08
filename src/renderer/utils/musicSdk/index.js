import kw from './kw/index'
import kg from './kg/index'
import tx from './tx/index'
import wy from './wy/index'
import mg from './mg/index'
import bd from './bd/index'
import xm from './xm'
import quran from './quran/index'
import { supportQuality } from './api-source'


const sources = {
  sources: [
    {
      name: '酷我音乐',
      id: 'kw',
    },
    {
      name: '酷狗音乐',
      id: 'kg',
    },
    {
      name: 'QQ音乐',
      id: 'tx',
    },
    {
      name: '网易音乐',
      id: 'wy',
    },
    {
      name: '咪咕音乐',
      id: 'mg',
    },
    {
      name: '虾米音乐',
      id: 'xm',
    },
    {
      name: 'Quran.com',
      id: 'quran',
    },
    // {
    //   name: '百度音乐',
    //   id: 'bd',
    // },
  ],
  kw,
  kg,
  tx,
  wy,
  mg,
  bd,
  xm,
  quran,
}
export default {
  ...sources,
  init() {
    const tasks = []
    for (let source of sources.sources) {
      let sm = sources[source.id]
      sm && sm.init && tasks.push(sm.init())
    }
    return Promise.all(tasks)
  },
  supportQuality,

  async searchMusic({ name, singer, source: s, limit = 25 }) {
    const trimStr = str => typeof str == 'string' ? str.trim() : str
    const musicName = trimStr(name)
    const tasks = []
    const excludeSource = ['xm']
    for (const source of sources.sources) {
      if (!sources[source.id].musicSearch || source.id == s || excludeSource.includes(source.id)) continue
      tasks.push(sources[source.id].musicSearch.search(`${musicName} ${singer || ''}`.trim(), 1, limit).catch(_ => null))
    }
    return (await Promise.all(tasks)).filter(s => s)
  },

  async findMusic({ name, singer, albumName, interval, source: s }) {
    const lists = await this.searchMusic({ name, singer, source: s, limit: 25 })
    // console.log(lists)
    // console.log({ name, singer, albumName, interval, source: s })

    const singersRxp = /、|&|;|；|\/|,|，|\|/
    const sortSingle = singer => singersRxp.test(singer)
      ? singer.split(singersRxp).sort((a, b) => a.localeCompare(b)).join('、')
      : (singer || '')
    const sortMusic = (arr, callback) => {
      const tempResult = []
      for (let i = arr.length - 1; i > -1; i--) {
        const item = arr[i]
        if (callback(item)) {
          delete item.fSinger
          delete item.fMusicName
          delete item.fAlbumName
          delete item.fInterval
          tempResult.push(item)
          arr.splice(i, 1)
        }
      }
      tempResult.reverse()
      return tempResult
    }
    const getIntv = (interval) => {
      if (!interval) return 0
      // if (musicInfo._interval) return musicInfo._interval
      let intvArr = interval.split(':')
      let intv = 0
      let unit = 1
      while (intvArr.length) {
        intv += parseInt(intvArr.pop()) * unit
        unit *= 60
      }
      return intv
    }
    const trimStr = str => typeof str == 'string' ? str.trim() : (str || '')
    const filterStr = str => typeof str == 'string' ? str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[|!|！/g, '') : String(str || '')
    const fMusicName = filterStr(name).toLowerCase()
    const fSinger = filterStr(sortSingle(singer)).toLowerCase()
    const fAlbumName = filterStr(albumName).toLowerCase()
    const fInterval = getIntv(interval)
    const isEqualsInterval = (intv) => Math.abs((fInterval || intv) - (intv || fInterval)) < 5
    const isIncludesName = (name) => (fMusicName.includes(name) || name.includes(fMusicName))
    const isIncludesSinger = (singer) => fSinger ? (fSinger.includes(singer) || singer.includes(fSinger)) : true
    const isEqualsAlbum = (album) => fAlbumName ? fAlbumName == album : true

    const result = lists.map(source => {
      for (const item of source.list) {
        item.name = trimStr(item.name)
        item.singer = trimStr(item.singer)
        item.fSinger = filterStr(sortSingle(item.singer).toLowerCase())
        item.fMusicName = filterStr(String(item.name ?? '').toLowerCase())
        item.fAlbumName = filterStr(String(item.albumName ?? '').toLowerCase())
        item.fInterval = getIntv(item.interval)
        // console.log(fMusicName, item.fMusicName, item.source)
        if (!isEqualsInterval(item.fInterval)) {
          item.name = null
          continue
        }
        if (item.fMusicName == fMusicName && isIncludesSinger(item.fSinger)) return item
      }
      for (const item of source.list) {
        if (item.name == null) continue
        if (item.fSinger == fSinger && isIncludesName(item.fMusicName)) return item
      }
      for (const item of source.list) {
        if (item.name == null) continue
        if (isEqualsAlbum(item.fAlbumName) && isIncludesSinger(item.fSinger) && isIncludesName(item.fMusicName)) return item
      }
      return null
    }).filter(s => s)
    const newResult = []
    if (result.length) {
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.fMusicName == fMusicName && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName && item.fSinger == fSinger && item.fAlbumName == fAlbumName))
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.fMusicName == fMusicName))
      newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.interval == interval))
      newResult.push(...sortMusic(result, item => item.interval == interval))
      newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName))
      newResult.push(...sortMusic(result, item => item.fSinger == fSinger))
      newResult.push(...sortMusic(result, item => item.fAlbumName == fAlbumName))
      for (const item of result) {
        delete item.fSinger
        delete item.fMusicName
        delete item.fAlbumName
        delete item.fInterval
      }
      newResult.push(...result)
    }
    // console.log(newResult)
    return newResult
  },

  // Quran-specific search functions
  async searchQuran({ query, type = 'surah', source: s, limit = 25 }) {
    const tasks = []
    for (const source of sources.sources) {
      if (source.id !== 'quran' || !sources[source.id]) continue
      if (type === 'reciter') {
        tasks.push(sources[source.id].reciterSearch.search(query, 1, limit).catch(_ => null))
      } else {
        tasks.push(sources[source.id].surahSearch.search(query, 1, limit).catch(_ => null))
      }
    }
    return (await Promise.all(tasks)).filter(s => s)
  },

  async searchReciters({ query, language, style, region, limit = 25 }) {
    const quranSource = sources.quran
    if (!quranSource) return { list: [], total: 0 }

    try {
      if (language) {
        return await quranSource.reciterSearch.getByLanguage(language, limit)
      } else if (style) {
        return await quranSource.reciterSearch.getByStyle(style, limit)
      } else {
        return await quranSource.reciterSearch.search(query, 1, limit)
      }
    } catch (error) {
      console.error('Search reciters error:', error)
      return { list: [], total: 0 }
    }
  },

  async searchSurahs({ query, revelationPlace, minVerses, maxVerses, limit = 25 }) {
    const quranSource = sources.quran
    if (!quranSource) return { list: [], total: 0 }

    try {
      if (revelationPlace) {
        return await quranSource.surahSearch.getByRevelationPlace(revelationPlace, limit)
      } else if (minVerses || maxVerses) {
        return await quranSource.surahSearch.getByVerseCount(minVerses || 1, maxVerses || 286, limit)
      } else {
        return await quranSource.surahSearch.search(query, 1, limit)
      }
    } catch (error) {
      console.error('Search surahs error:', error)
      return { list: [], total: 0 }
    }
  },

  async getQuranAudio(surahId, reciterId, quality = '320k') {
    const quranSource = sources.quran
    if (!quranSource) throw new Error('Quran source not available')

    try {
      return await quranSource.getAudioUrl({ id: surahId }, reciterId, quality)
    } catch (error) {
      console.error('Get Quran audio error:', error)
      throw error
    }
  },

  async getVerseAudio(surahId, verseId, reciterId, quality = '320k') {
    const quranSource = sources.quran
    if (!quranSource) throw new Error('Quran source not available')

    try {
      return await quranSource.getVerseAudio(surahId, verseId, reciterId, quality)
    } catch (error) {
      console.error('Get verse audio error:', error)
      throw error
    }
  },

  async getPopularReciters(limit = 20) {
    const quranSource = sources.quran
    if (!quranSource) return { list: [], total: 0 }

    try {
      return await quranSource.reciterSearch.getPopular(limit)
    } catch (error) {
      console.error('Get popular reciters error:', error)
      return { list: [], total: 0 }
    }
  },

  async getAllSurahs() {
    const quranSource = sources.quran
    if (!quranSource) return { list: [], total: 0 }

    try {
      return await quranSource.surahSearch.getAll(114)
    } catch (error) {
      console.error('Get all surahs error:', error)
      return { list: [], total: 0 }
    }
  },
}
