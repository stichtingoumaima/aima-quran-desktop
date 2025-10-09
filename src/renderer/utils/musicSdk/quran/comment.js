// Quran doesn't have traditional comments, but we can show verse translations/tafsir
import { httpFetch } from '../../request'

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get verse translations (acts as comments)
  getVerseTranslations(verseKey, translationId = 131) {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/verses/by_key/${verseKey}?translations=${translationId}&translation_fields=resource_name,language_id`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.verse || !body.verse.translations) {
        return Promise.reject(new Error('No translations found for this verse'))
      }
      return body.verse.translations
    })
  },

  // Get word-by-word translations
  getWordByWordTranslations(verseKey, language = 'en') {
    const requestObj = httpFetch(`https://api.qurancdn.com/api/qdc/verses/by_key/${verseKey}?words=true&word_translation_language=${language}&word_fields=verse_key,verse_id,page_number,location,text_uthmani,text_imlaei_simple,qpc_uthmani_hafs`)
    return requestObj.promise.then(({ body }) => {
      if (!body || !body.verse || !body.verse.words) {
        return Promise.reject(new Error('No word-by-word translations found'))
      }
      return body.verse.words
    })
  },

  handleResult(translations) {
    if (!translations) return []

    return translations.map((translation, index) => ({
      id: translation.id || index,
      text: translation.text,
      author: translation.resourceName,
      language: translation.languageName,
      resourceId: translation.resourceId,
      languageId: translation.languageId,
      timestamp: new Date().toISOString(),
      isTranslation: true,
    }))
  },

  // Get comments (translations) for a verse
  getComment(verseKey, translationId = 131) {
    return this.getVerseTranslations(verseKey, translationId).then(translations => {
      return this.handleResult(translations)
    })
  },

  // Get hot comments (popular translations)
  getHotComment(verseKey) {
    // Get multiple popular translations
    const popularTranslationIds = [131, 20, 21, 22, 23] // Popular translation IDs
    const promises = popularTranslationIds.map(id =>
      this.getVerseTranslations(verseKey, id).catch(() => []),
    )

    return Promise.all(promises).then(translationArrays => {
      const allTranslations = translationArrays.flat()
      return this.handleResult(allTranslations)
    })
  },
}
