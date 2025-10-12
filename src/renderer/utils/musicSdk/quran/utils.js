// Utility functions for Quran source

/**
 * Format duration from seconds to HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration in hours:minutes:seconds
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format file size from bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0MB'
  const mb = (bytes / (1024 * 1024)).toFixed(1)
  return `${mb}MB`
}

/**
 * Get chapter name in Arabic
 * @param {number} chapterId - Chapter ID (1-114)
 * @returns {string} Chapter name in Arabic
 */
export const getChapterNameArabic = (chapterId) => {
  const chapterNames = {
    1: 'الفاتحة',
    2: 'البقرة',
    3: 'آل عمران',
    4: 'النساء',
    5: 'المائدة',
    6: 'الأنعام',
    7: 'الأعراف',
    8: 'الأنفال',
    9: 'التوبة',
    10: 'يونس',
    11: 'هود',
    12: 'يوسف',
    13: 'الرعد',
    14: 'إبراهيم',
    15: 'الحجر',
    16: 'النحل',
    17: 'الإسراء',
    18: 'الكهف',
    19: 'مريم',
    20: 'طه',
    21: 'الأنبياء',
    22: 'الحج',
    23: 'المؤمنون',
    24: 'النور',
    25: 'الفرقان',
    26: 'الشعراء',
    27: 'النمل',
    28: 'القصص',
    29: 'العنكبوت',
    30: 'الروم',
    31: 'لقمان',
    32: 'السجدة',
    33: 'الأحزاب',
    34: 'سبأ',
    35: 'فاطر',
    36: 'يس',
    37: 'الصافات',
    38: 'ص',
    39: 'الزمر',
    40: 'غافر',
    41: 'فصلت',
    42: 'الشورى',
    43: 'الزخرف',
    44: 'الدخان',
    45: 'الجاثية',
    46: 'الأحقاف',
    47: 'محمد',
    48: 'الفتح',
    49: 'الحجرات',
    50: 'ق',
    51: 'الذاريات',
    52: 'الطور',
    53: 'النجم',
    54: 'القمر',
    55: 'الرحمن',
    56: 'الواقعة',
    57: 'الحديد',
    58: 'المجادلة',
    59: 'الحشر',
    60: 'الممتحنة',
    61: 'الصف',
    62: 'الجمعة',
    63: 'المنافقون',
    64: 'التغابن',
    65: 'الطلاق',
    66: 'التحريم',
    67: 'الملك',
    68: 'القلم',
    69: 'الحاقة',
    70: 'المعارج',
    71: 'نوح',
    72: 'الجن',
    73: 'المزمل',
    74: 'المدثر',
    75: 'القيامة',
    76: 'الإنسان',
    77: 'المرسلات',
    78: 'النبأ',
    79: 'النازعات',
    80: 'عبس',
    81: 'التكوير',
    82: 'الانفطار',
    83: 'المطففين',
    84: 'الانشقاق',
    85: 'البروج',
    86: 'الطارق',
    87: 'الأعلى',
    88: 'الغاشية',
    89: 'الفجر',
    90: 'البلد',
    91: 'الشمس',
    92: 'الليل',
    93: 'الضحى',
    94: 'الشرح',
    95: 'التين',
    96: 'العلق',
    97: 'القدر',
    98: 'البينة',
    99: 'الزلزلة',
    100: 'العاديات',
    101: 'القارعة',
    102: 'التكاثر',
    103: 'العصر',
    104: 'الهمزة',
    105: 'الفيل',
    106: 'قريش',
    107: 'الماعون',
    108: 'الكوثر',
    109: 'الكافرون',
    110: 'النصر',
    111: 'المسد',
    112: 'الإخلاص',
    113: 'الفلق',
    114: 'الناس',
  }
  return chapterNames[chapterId] || ''
}

/**
 * Get chapter name in English
 * @param {number} chapterId - Chapter ID (1-114)
 * @returns {string} Chapter name in English
 */
export const getChapterNameEnglish = (chapterId) => {
  const chapterNames = {
    1: 'Al-Fatihah',
    2: 'Al-Baqarah',
    3: 'Ali Imran',
    4: 'An-Nisa',
    5: 'Al-Maidah',
    6: 'Al-Anam',
    7: 'Al-Araf',
    8: 'Al-Anfal',
    9: 'At-Tawbah',
    10: 'Yunus',
    11: 'Hud',
    12: 'Yusuf',
    13: 'Ar-Rad',
    14: 'Ibrahim',
    15: 'Al-Hijr',
    16: 'An-Nahl',
    17: 'Al-Isra',
    18: 'Al-Kahf',
    19: 'Maryam',
    20: 'Taha',
    21: 'Al-Anbiya',
    22: 'Al-Hajj',
    23: 'Al-Muminun',
    24: 'An-Nur',
    25: 'Al-Furqan',
    26: 'Ash-Shuara',
    27: 'An-Naml',
    28: 'Al-Qasas',
    29: 'Al-Ankabut',
    30: 'Ar-Rum',
    31: 'Luqman',
    32: 'As-Sajdah',
    33: 'Al-Ahzab',
    34: 'Saba',
    35: 'Fatir',
    36: 'Yasin',
    37: 'As-Saffat',
    38: 'Sad',
    39: 'Az-Zumar',
    40: 'Ghafir',
    41: 'Fussilat',
    42: 'Ash-Shura',
    43: 'Az-Zukhruf',
    44: 'Ad-Dukhan',
    45: 'Al-Jathiyah',
    46: 'Al-Ahqaf',
    47: 'Muhammad',
    48: 'Al-Fath',
    49: 'Al-Hujurat',
    50: 'Qaf',
    51: 'Adh-Dhariyat',
    52: 'At-Tur',
    53: 'An-Najm',
    54: 'Al-Qamar',
    55: 'Ar-Rahman',
    56: 'Al-Waqiah',
    57: 'Al-Hadid',
    58: 'Al-Mujadila',
    59: 'Al-Hashr',
    60: 'Al-Mumtahanah',
    61: 'As-Saff',
    62: 'Al-Jumuah',
    63: 'Al-Munafiqun',
    64: 'At-Taghabun',
    65: 'At-Talaq',
    66: 'At-Tahrim',
    67: 'Al-Mulk',
    68: 'Al-Qalam',
    69: 'Al-Haqqah',
    70: 'Al-Maarij',
    71: 'Nuh',
    72: 'Al-Jinn',
    73: 'Al-Muzzammil',
    74: 'Al-Muddaththir',
    75: 'Al-Qiyamah',
    76: 'Al-Insan',
    77: 'Al-Mursalat',
    78: 'An-Naba',
    79: 'An-Naziat',
    80: 'Abasa',
    81: 'At-Takwir',
    82: 'Al-Infitar',
    83: 'Al-Mutaffifin',
    84: 'Al-Inshiqaq',
    85: 'Al-Buruj',
    86: 'At-Tariq',
    87: 'Al-Ala',
    88: 'Al-Ghashiyah',
    89: 'Al-Fajr',
    90: 'Al-Balad',
    91: 'Ash-Shams',
    92: 'Al-Layl',
    93: 'Ad-Duha',
    94: 'Ash-Sharh',
    95: 'At-Tin',
    96: 'Al-Alaq',
    97: 'Al-Qadr',
    98: 'Al-Bayyinah',
    99: 'Az-Zalzalah',
    100: 'Al-Adiyat',
    101: 'Al-Qariah',
    102: 'At-Takathur',
    103: 'Al-Asr',
    104: 'Al-Humazah',
    105: 'Al-Fil',
    106: 'Quraysh',
    107: 'Al-Maun',
    108: 'Al-Kawthar',
    109: 'Al-Kafirun',
    110: 'An-Nasr',
    111: 'Al-Masad',
    112: 'Al-Ikhlas',
    113: 'Al-Falaq',
    114: 'An-Nas',
  }
  return chapterNames[chapterId] || ''
}

/**
 * Validate verse key format (e.g., "1:1", "2:255")
 * @param {string} verseKey - Verse key to validate
 * @returns {boolean} True if valid
 */
export const isValidVerseKey = (verseKey) => {
  const regex = /^(\d{1,3}):(\d{1,3})$/
  return regex.test(verseKey)
}

/**
 * Parse verse key to get chapter and verse numbers
 * @param {string} verseKey - Verse key (e.g., "1:1")
 * @returns {object} Object with chapterId and verseNumber
 */
export const parseVerseKey = (verseKey) => {
  if (!isValidVerseKey(verseKey)) {
    throw new Error('Invalid verse key format')
  }
  const [chapterId, verseNumber] = verseKey.split(':').map(Number)
  return { chapterId, verseNumber }
}

/**
 * Build verse key from chapter and verse numbers
 * @param {number} chapterId - Chapter ID
 * @param {number} verseNumber - Verse number
 * @returns {string} Verse key
 */
export const buildVerseKey = (chapterId, verseNumber) => {
  return `${chapterId}:${verseNumber}`
}

/**
 * Get revelation place for a chapter
 * @param {number} chapterId - Chapter ID
 * @returns {string} Revelation place (Makkah or Madinah)
 */
export const getRevelationPlace = (chapterId) => {
  const makkahChapters = [
    1, 6, 7, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 50, 51, 52, 53, 54, 55, 56, 67, 68, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
  ]
  return makkahChapters.includes(chapterId) ? 'Makkah' : 'Madinah'
}

/**
 * Get local reciter image path for a given reciter ID
 * @param {number|string} reciterId - Reciter ID from Quran.com API
 * @returns {string|null} Local image path or null if not found
 */
export const getReciterLocalImage = (reciterId) => {
  if (!reciterId) {
    console.log('🔍 No reciter ID provided')
    return null
  }

  // Available local reciter images
  const availableImages = ['1', '2', '3', '4', '5', '6', '7', '9', '10', '12', '97', '161', '168', '173']
  const reciterIdStr = String(reciterId)

  console.log('🔍 Checking for local image for reciter ID:', reciterIdStr, 'Available:', availableImages)

  if (availableImages.includes(reciterIdStr)) {
    // Use static asset path that works with webpack dev server
    const imagePath = reciterIdStr === '2' || reciterIdStr === '3' || reciterIdStr === '97' || reciterIdStr === '168'
      ? `/static/reciters/${reciterIdStr}.jpeg`
      : `/static/reciters/${reciterIdStr}.jpg`
    console.log('✅ Found local image path:', imagePath)
    return imagePath
  }

  console.log('❌ No local image available for reciter ID:', reciterIdStr)
  return null
}

/**
 * Get reciter image with fallback to local image
 * @param {object} reciter - Reciter object from API
 * @returns {string} Image URL (API image or local fallback)
 */
export const getReciterImage = (reciter) => {
  if (!reciter) return ''

  // First try API provided images
  if (reciter.profilePicture) {
    console.log('🎨 Using API profile picture for reciter:', reciter.id, reciter.name)
    return reciter.profilePicture
  }
  if (reciter.coverImage) {
    console.log('🎨 Using API cover image for reciter:', reciter.id, reciter.name)
    return reciter.coverImage
  }

  // Fallback to local image
  const localImage = getReciterLocalImage(reciter.id)
  if (localImage) {
    console.log('🖼️ Using local image for reciter:', reciter.id, reciter.name, '->', localImage)
    return localImage
  }

  // Final fallback - empty string
  console.log('❌ No image found for reciter:', reciter.id, reciter.name)
  return ''
}
