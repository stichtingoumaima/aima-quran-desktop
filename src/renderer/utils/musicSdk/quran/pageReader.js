import { httpFetch } from '../../request'
import { headers, timeout } from '../options'
import { dnsLookup } from '../utils'
import { QuranFont } from './fontUtils'

const pageReader = {
  // Get verses by page number
  getVersesByPage(pageNumber, quranFont = QuranFont.MadaniV1) {
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

  // Get page info (total pages, etc.)
  getPageInfo() {
    return {
      totalPages: 604,
      availablePages: 5, // For basic implementation
    }
  },
}

export default pageReader
