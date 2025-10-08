import { httpFetch } from '../../request'

const audioSearch = {
  // Search for audio files by surah and reciter
  searchAudio(surahId, reciterId, quality = '128k') {
    return httpFetch(`https://api.quran.com/api/v4/audio_files?recitation=${reciterId}&chapter=${surahId}`).promise.then(({ body }) => {
      if (!body.audio_files || body.audio_files.length === 0) {
        return {
          list: [],
          total: 0,
        }
      }

      // Filter by quality if specified
      const filteredFiles = quality
        ? body.audio_files.filter(file => file.format === quality)
        : body.audio_files

      return {
        list: filteredFiles.map(audio => ({
          id: audio.id,
          url: audio.url,
          format: audio.format,
          duration: audio.duration,
          segments: audio.segments,
          surahId,
          reciterId,
          source: 'quran',
        })),
        total: filteredFiles.length,
      }
    }).catch(error => {
      console.error('Audio search error:', error)
      return {
        list: [],
        total: 0,
      }
    })
  },

  // Get verse audio
  getVerseAudio(surahId, verseId, reciterId) {
    return httpFetch(`https://api.quran.com/api/v4/verses/${surahId}:${verseId}?recitation=${reciterId}`).promise.then(({ body }) => {
      if (!body.audio || !body.audio.url) {
        throw new Error('Verse audio not found')
      }

      return {
        id: `${surahId}_${verseId}_${reciterId}`,
        url: body.audio.url,
        format: body.audio.format || 'mp3',
        duration: body.audio.duration,
        surahId,
        verseId,
        reciterId,
        source: 'quran',
      }
    }).catch(error => {
      console.error('Get verse audio error:', error)
      throw error
    })
  },

  // Get chapter recitation
  getChapterRecitation(surahId, reciterId) {
    return httpFetch(`https://api.quran.com/api/v4/chapter_recitations/${surahId}/${reciterId}`).promise.then(({ body }) => {
      if (!body.audio_files || body.audio_files.length === 0) {
        throw new Error('Chapter recitation not found')
      }

      return {
        surahId,
        reciterId,
        audioFiles: body.audio_files.map(audio => ({
          id: audio.id,
          url: audio.url,
          format: audio.format,
          duration: audio.duration,
          segments: audio.segments,
        })),
        source: 'quran',
      }
    }).catch(error => {
      console.error('Get chapter recitation error:', error)
      throw error
    })
  },

  // Get available audio formats for a recitation
  getAvailableFormats(surahId, reciterId) {
    return httpFetch(`https://api.quran.com/api/v4/audio_files?recitation=${reciterId}&chapter=${surahId}`).promise.then(({ body }) => {
      if (!body.audio_files) {
        return []
      }

      const formats = [...new Set(body.audio_files.map(file => file.format))]
      return formats.sort()
    }).catch(error => {
      console.error('Get available formats error:', error)
      return []
    })
  },
}

export default audioSearch
