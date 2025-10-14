/**
 * Quran font utilities based on Quran.com implementation
 */

// Font types matching Quran.com
export const QuranFont = {
  MadaniV1: 'code_v1',
  MadaniV2: 'code_v2',
  TajweedV4: 'tajweed_v4',
  Uthmani: 'text_uthmani',
  IndoPak: 'text_indopak',
  QPCHafs: 'qpc_uthmani_hafs',
  Tajweed: 'tajweed',
}

// Mushaf IDs matching Quran.com
export const Mushaf = {
  QCFV2: 1,
  QCFV1: 2,
  Indopak: 3,
  UthmaniHafs: 4,
  KFGQPCHAFS: 5, // This is what we want for QPC Hafs
  Indopak15Lines: 6,
  Indopak16Lines: 7,
  Tajweed: 11,
  QCFTajweedV4: 19,
}

// Font to Mushaf mapping
export const QuranFontMushaf = {
  [QuranFont.MadaniV1]: Mushaf.QCFV1,
  [QuranFont.MadaniV2]: Mushaf.QCFV2,
  [QuranFont.TajweedV4]: Mushaf.QCFTajweedV4,
  [QuranFont.Uthmani]: Mushaf.UthmaniHafs,
  [QuranFont.IndoPak]: Mushaf.Indopak,
  [QuranFont.QPCHafs]: Mushaf.KFGQPCHAFS,
  [QuranFont.Tajweed]: Mushaf.Tajweed,
}

/**
 * Get default word fields based on the selected Quran font
 * Based on Quran.com's getDefaultWordFields function
 *
 * @param {string} quranFont - The selected Quran font
 * @returns {{ wordFields: string }}
 */
export const getDefaultWordFields = (quranFont = QuranFont.QPCHafs) => {
  const baseFields = 'verse_key,verse_id,page_number,line_number,location,text_uthmani,text_imlaei_simple'

  // Add font-specific fields
  let fontFields = ''
  if (quranFont === QuranFont.TajweedV4) {
    fontFields = `,${QuranFont.MadaniV2},${QuranFont.QPCHafs}`
  } else {
    fontFields = `,${quranFont}`
    if (quranFont !== QuranFont.QPCHafs) {
      fontFields += `,${QuranFont.QPCHafs}` // Always include QPC Hafs as fallback
    }
  }

  return {
    wordFields: baseFields + fontFields,
  }
}

/**
 * Get mushaf ID based on the Quran font
 *
 * @param {string} quranFont - The selected Quran font
 * @returns {{ mushaf: number }}
 */
export const getMushafId = (quranFont = QuranFont.QPCHafs) => {
  return {
    mushaf: QuranFontMushaf[quranFont] || Mushaf.KFGQPCHAFS,
  }
}
