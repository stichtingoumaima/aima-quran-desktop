# Quran.com Music Source Implementation

This is a complete implementation of a Quran.com source for the music SDK, allowing users to browse reciters as playlists, view all 114 surahs, and play recitations.

## 🎯 **Features Implemented**

### **1. Reciter Search (Playlists)**
- Shows all available reciters from Quran.com API
- Each reciter appears as a "playlist" in the music SDK
- Includes reciter profile pictures, names, and recitation styles
- Search functionality to filter reciters by name or style

### **2. Song List (Surahs)**
- Displays all 114 chapters (surahs) of the Quran
- When a reciter is selected, shows all surahs for that reciter
- Includes audio URLs, durations, and verse timings
- Automatic fetching of audio metadata

### **3. Audio Playback**
- Direct integration with Quran.com audio API
- MP3 format support
- Verse-by-verse timing information
- Word-by-word audio segments

### **4. Additional Features**
- **Leaderboard**: Popular reciters
- **Hot Search**: Popular Quran searches
- **Comments**: Verse translations and tafsir
- **Music Search**: Search verses by text

## 📁 **File Structure**

```
quran/
├── index.js              # Main source module
├── reciterSearch.js      # Reciter search (playlists)
├── songList.js          # Chapter/surah listing
├── musicSearch.js       # Verse search functionality
├── leaderboard.js       # Popular reciters
├── hotSearch.js         # Popular searches
├── comment.js           # Verse translations
├── api-test.js          # API endpoints
├── utils.js             # Utility functions
└── README.md            # This documentation
```

## 🔧 **API Integration**

### **Base API Configuration**
```javascript
const BASE_URL = 'https://api.qurancdn.com/api/qdc'
```

### **Key Endpoints Used**
1. **Reciters**: `/audio/reciters`
2. **Chapters**: `/chapters`
3. **Audio Files**: `/audio/reciters/{id}/audio_files`
4. **Verses**: `/verses/by_chapter/{id}`
5. **Search**: `/search`

## 🎵 **Data Flow**

### **1. Browse Reciters (Playlists)**
```
User opens Quran source → reciterSearch.search() → 
Fetches reciters from API → Transforms to music SDK format → 
Shows as playlists
```

### **2. Select Reciter → View Surahs**
```
User clicks reciter → songList.getChaptersForReciter() → 
Fetches all 114 chapters → Fetches audio data for each → 
Shows as songs with durations
```

### **3. Play Recitation**
```
User clicks surah → getMusicUrl() → 
Fetches audio URL from API → Returns MP3 URL → 
Plays recitation
```

## 📊 **Data Structures**

### **Reciter Object (Playlist)**
```javascript
{
  name: "Abdul Rahman Al-Sudais",
  singer: "Abdul Rahman Al-Sudais", 
  source: "quran",
  songmid: "reciter_7",
  albumName: "Murattal - Hafs",
  img: "https://cdn.qurancdn.com/assets/reciters/7/profile_picture.jpg",
  reciterId: 7,
  reciterName: "Abdul Rahman Al-Sudais",
  recitationStyle: "Hafs",
  isReciter: true
}
```

### **Chapter Object (Song)**
```javascript
{
  name: "Al-Fatihah",
  singer: "Abdul Rahman Al-Sudais",
  source: "quran", 
  songmid: "chapter_1_7",
  albumName: "Surah Al-Fatihah",
  interval: "0:45",
  audioUrl: "https://cdn.qurancdn.com/audio/abdurrahmaansudais/mp3/001001.mp3",
  chapterId: 1,
  chapterName: "Al-Fatihah",
  versesCount: 7,
  reciterId: 7,
  duration: 45.2,
  verseTimings: [...],
  isChapter: true
}
```

## 🚀 **Usage Examples**

### **Search for Reciters**
```javascript
import musicSdk from './musicSdk'

// Get all reciters
const reciters = await musicSdk.quran.reciterSearch.search('', 1, 30)

// Search for specific reciter
const sudais = await musicSdk.quran.reciterSearch.search('sudais', 1, 10)
```

### **Get Chapters for Reciter**
```javascript
// Get all surahs for a specific reciter
const chapters = await musicSdk.quran.songList.getChaptersForReciter(7, reciterInfo)
```

### **Play Recitation**
```javascript
// Get audio URL for a chapter
const audioData = await musicSdk.quran.getMusicUrl(chapterInfo, 'mp3')
```

### **Search Verses**
```javascript
// Search for verses containing specific text
const verses = await musicSdk.quran.musicSearch.search('allah', 1, 20)
```

## 🔄 **Integration with Music SDK**

The Quran source is fully integrated with the existing music SDK:

1. **Registered in main index**: Added to sources list
2. **API support**: Added to api-source configuration  
3. **Quality support**: MP3 format support
4. **Standard interface**: Implements all required methods

### **Required Methods Implemented**
- `getMusicUrl()` - Get audio URLs
- `getLyric()` - Get verse text/translations
- `getPic()` - Get reciter/chapter images
- `getMusicDetailPageUrl()` - Get Quran.com URLs
- `handleMusicInfo()` - Transform data format

## 🌐 **API Rate Limiting & Error Handling**

- **Retry Logic**: 3 attempts for failed requests
- **Error Handling**: Graceful fallbacks for missing data
- **Timeout**: 15-second timeout for requests
- **DNS Lookup**: Cached DNS resolution

## 📱 **User Experience Flow**

1. **Browse**: User sees "Quran.com" in source list
2. **Reciters**: Clicking shows all reciters as playlists
3. **Surahs**: Clicking a reciter shows all 114 surahs
4. **Play**: Clicking a surah plays the recitation
5. **Search**: Can search for specific verses or reciters

## 🔧 **Configuration**

### **API Parameters**
- **Mushaf**: 4 (Uthmani Hafs)
- **Translations**: 131 (The Clear Quran)
- **Language**: en (English)
- **Format**: MP3

### **Pagination**
- **Default Limit**: 30 items per page
- **Max Retries**: 3 attempts
- **Timeout**: 15 seconds

## 🎯 **Future Enhancements**

1. **Offline Support**: Cache audio files locally
2. **Multiple Translations**: Support for different translation languages
3. **Word-by-Word**: Highlight words during playback
4. **Bookmarks**: Save favorite verses/reciters
5. **Playlists**: Create custom recitation playlists

## 🐛 **Troubleshooting**

### **Common Issues**
1. **No Audio**: Check if reciter has audio for the chapter
2. **Slow Loading**: API rate limiting, retry logic handles this
3. **Missing Data**: Some reciters may not have all chapters

### **Debug Mode**
Enable console logging to see API requests and responses.

## 📄 **License**

This implementation follows the same license as the main music SDK project.
