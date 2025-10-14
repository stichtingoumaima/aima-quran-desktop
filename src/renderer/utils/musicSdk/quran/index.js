import reciterSearch from './reciterSearch'
import songList from './songList'
import musicSearch from './musicSearch'
import leaderboard from './leaderboard'
import hotSearch from './hotSearch'
import comment from './comment'
import pageReader from './pageReader'
import { apis } from '../api-source'

const quran = {
  reciterSearch,
  songList,
  musicSearch,
  leaderboard,
  hotSearch,
  comment,
  pageReader,

  getMusicUrl(songInfo, type) {
    return apis('quran').getMusicUrl(songInfo, type)
  },

  getLyric(songInfo) {
    // Quran doesn't have traditional lyrics, but we can return verse text
    return {
      promise: Promise.resolve({
        lyric: songInfo.verseText || '',
        tlyric: songInfo.translation || '',
        lxlyric: '',
        rlyric: '',
      }),
    }
  },

  getPic(songInfo) {
    // Return reciter profile picture or chapter image
    return Promise.resolve(songInfo.reciterPic || songInfo.chapterImage || '')
  },

  getMusicDetailPageUrl(songInfo) {
    return `https://quran.com/${songInfo.chapterId}?reciter=${songInfo.reciterId}`
  },

  // Handle music info - transform Quran data to music SDK format
  handleMusicInfo(songInfo) {
    return Promise.resolve({
      name: songInfo.name,
      singer: songInfo.reciterName,
      img: songInfo.reciterPic,
      albumName: `Surah ${songInfo.chapterName}`,
      interval: songInfo.duration ? this.formatDuration(songInfo.duration) : '0:00',
      ...songInfo,
    })
  },

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },
}

export default quran
