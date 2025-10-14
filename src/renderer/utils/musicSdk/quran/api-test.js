import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'
import { dnsLookup } from '../utils'

const api_test = {
  // Get audio URL for a specific reciter and chapter
  getMusicUrl(songInfo, type) {
    console.log('🎵 Quran getMusicUrl called:', { songInfo, type })
    console.log('🔍 Full songInfo object:', JSON.stringify(songInfo, null, 2))

    // For Quran, we only support MP3 format
    if (type !== 'mp3') {
      console.log('❌ Unsupported format:', type)
      return {
        promise: Promise.reject(new Error('Only MP3 format is supported for Quran recitations')),
      }
    }

    // If we already have the audio URL from the song info, return it
    if (songInfo.audioUrl) {
      return {
        promise: Promise.resolve({
          type: 'mp3',
          url: songInfo.audioUrl,
        }),
      }
    }

    // Extract reciterId and chapterId from various possible locations
    let reciterId = songInfo.reciterId || songInfo.meta?.reciterId
    let chapterId = songInfo.chapterId || songInfo.meta?.chapterId

    // If not found in direct fields, try to extract from songmid
    if (!reciterId || !chapterId) {
      const songmidParts = songInfo.songmid?.split('_') || []
      if (songmidParts.length >= 3) {
        // Format: chapter_8_default -> chapterId=8, reciterId=default
        chapterId = chapterId || songmidParts[1]
        reciterId = reciterId || songmidParts[2]
      }
    }

    // If reciterId is still 'default', try to extract from the reciterId field
    if (reciterId === 'default' && songInfo.reciterId) {
      reciterId = songInfo.reciterId
    }

    console.log('🌐 Extracted IDs - reciterId:', reciterId, 'chapterId:', chapterId)
    console.log('🌐 Fetching audio URL for reciter:', reciterId, 'chapter:', chapterId)

    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=false`, {
      method: 'get',
      headers,
      timeout,
      lookup: dnsLookup,
      family: 4,
    })

    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      console.log('📡 Audio API response:', { statusCode, body })
      console.log('🔍 Full response body:', JSON.stringify(body, null, 2))

      if (statusCode === 429) return Promise.reject(new Error(requestMsg.tooManyRequests))

      if (!body || !body.audio_files || body.audio_files.length === 0) {
        console.log('❌ No audio files found in response')
        console.log('🔍 Body structure:', {
          hasBody: !!body,
          bodyKeys: body ? Object.keys(body) : 'no body',
          hasAudioFiles: body && body.audio_files,
          audioFilesLength: body && body.audio_files ? body.audio_files.length : 'no audio_files',
        })
        return Promise.reject(new Error('No audio found for this chapter'))
      }

      const audioFile = body.audio_files[0]
      console.log('✅ Found audio file:', audioFile)

      return Promise.resolve({
        type: 'mp3',
        url: audioFile.audio_url,
        duration: audioFile.duration,
        fileSize: audioFile.file_size,
        verseTimings: audioFile.verse_timings,
      })
    }).catch(error => {
      console.error('❌ Error fetching audio URL:', error)
      return Promise.reject(error)
    })

    return requestObj
  },

  // Get verse timestamps for a specific reciter and verse
  getVerseTimestamps(reciterId, verseKey) {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/verse_timestamps?verse_key=${verseKey}`, {
      method: 'get',
      headers,
      timeout,
      lookup: dnsLookup,
      family: 4,
    })

    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode === 429) return Promise.reject(new Error(requestMsg.tooManyRequests))

      if (!body || !body.result) {
        return Promise.reject(new Error('No timestamps found for this verse'))
      }

      return Promise.resolve(body.result)
    })

    return requestObj
  },

  // Get chapter audio with segments for detailed timing
  getChapterAudioWithSegments(reciterId, chapterId) {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=true`, {
      method: 'get',
      headers,
      timeout,
      lookup: dnsLookup,
      family: 4,
    })

    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode === 429) return Promise.reject(new Error(requestMsg.tooManyRequests))

      if (!body || !body.audioFiles || body.audioFiles.length === 0) {
        return Promise.reject(new Error('No audio found for this chapter'))
      }

      return Promise.resolve(body.audioFiles[0])
    })

    return requestObj
  },

  // Get verses by page number
  getVersesByPage(pageNumber, quranFont = 'madani_v1') {
    console.log('📖 Fetching verses for page:', pageNumber, 'font:', quranFont)

    // Use Madani V1 (mushaf=1) as per Quran.com specification
    const mushaf = 1
    const wordFields = 'verse_key,verse_id,page_number,line_number,location,text_uthmani,text_imlaei_simple,code_v1,code_v2,qpc_uthmani_hafs'

    const url = `https://api.qurancdn.com/api/qdc/verses/by_page/${pageNumber}?words=true&per_page=all&mushaf=${mushaf}&filter_page_words=true&word_fields=${wordFields}&reciter=7&word_translation_language=en&locale=en`

    const requestObj = httpFetch(url, {
      method: 'get',
      headers,
      timeout,
      lookup: dnsLookup,
      family: 4,
    })

    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      console.log('📡 Page verses API response:', { statusCode, pageNumber })

      if (statusCode === 429) {
        return Promise.reject(new Error('Too many requests'))
      }

      if (!body || !body.verses) {
        console.error('❌ Invalid API response structure:', body)
        return Promise.reject(new Error('Failed to fetch verses for page'))
      }

      console.log('✅ Found verses:', body.verses.length, 'for page:', pageNumber)
      return body
    }).catch(error => {
      console.error('❌ Error fetching page verses:', error)
      return Promise.reject(error)
    })

    return requestObj
  },
}

export default api_test
