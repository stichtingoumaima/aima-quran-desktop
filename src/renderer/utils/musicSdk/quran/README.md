# Quran SDK Integration

This module integrates the Quran.com API into the existing music player architecture, allowing users to search for reciters, surahs, and play Quran recitations.

## Features

- **50+ Reciters**: Access to popular Quran reciters from around the world
- **114 Surahs**: Complete access to all chapters of the Quran
- **Multiple Audio Qualities**: 128k, 320k, FLAC support
- **Verse-by-Verse Audio**: Precise audio timing for each verse
- **Search Functionality**: Search reciters and surahs by name, language, style
- **Integration**: Seamless integration with existing player features

## API Endpoints Used

- `https://api.quran.com/api/v4/resources/recitations` - Get all reciters
- `https://api.quran.com/api/v4/chapters` - Get all surahs
- `https://api.quran.com/api/v4/chapter_recitations/{surahId}/{reciterId}` - Get surah audio
- `https://api.quran.com/api/v4/verses/{surahId}:{verseId}?recitation={reciterId}` - Get verse audio
- `https://api.quran.com/api/v4/audio_files?recitation={reciterId}&chapter={surahId}` - Get audio files

## Usage Examples

### Basic Usage

```javascript
import musicSdk from '../index'

// Search for reciters
const reciters = await musicSdk.searchReciters({ 
  query: 'Abdul Basit' 
})

// Search for surahs
const surahs = await musicSdk.searchSurahs({ 
  query: 'Al-Fatiha' 
})

// Get audio for playback
const audio = await musicSdk.getQuranAudio(1, 1, '320k')
```

### Advanced Usage

```javascript
// Get popular reciters
const popular = await musicSdk.getPopularReciters(20)

// Get all surahs
const allSurahs = await musicSdk.getAllSurahs()

// Get reciters by language
const arabicReciters = await musicSdk.searchReciters({ 
  language: 'Arabic' 
})

// Get surahs by revelation place
const meccanSurahs = await musicSdk.searchSurahs({ 
  revelationPlace: 'Mecca' 
})
```

### Creating Playlists

```javascript
// Create a playlist of surahs
async function createSurahPlaylist() {
  const reciters = await musicSdk.getPopularReciters(5)
  const surahs = await musicSdk.searchSurahs({ limit: 10 })
  
  const playlist = []
  for (const surah of surahs.list.slice(0, 5)) {
    try {
      const audio = await musicSdk.getQuranAudio(surah.id, reciters.list[0].id, '320k')
      playlist.push({
        name: surah.name,
        singer: reciters.list[0].name,
        albumName: `Surah ${surah.name}`,
        url: audio.url,
        duration: audio.duration,
        source: 'quran'
      })
    } catch (error) {
      console.error(`Error getting audio for ${surah.name}:`, error)
    }
  }
  
  return playlist
}
```

## Data Structure

### Reciter Object
```javascript
{
  id: 1,
  name: "Abdul Basit Abdul Samad",
  translatedName: "Abdul Basit Abdul Samad",
  language: "Arabic",
  style: "Mujawwad",
  region: "Egypt",
  source: "quran"
}
```

### Surah Object
```javascript
{
  id: 1,
  name: "Al-Fatiha",
  nameArabic: "الفاتحة",
  nameComplex: "Al-Fātiḥah",
  versesCount: 7,
  revelationOrder: 5,
  revelationPlace: "Mecca",
  source: "quran"
}
```

### Audio Object
```javascript
{
  url: "https://verses.quran.com/Abdul_Basit_Murattal/001001.mp3",
  format: "mp3",
  duration: 45.2,
  segments: [...],
  surahId: 1,
  reciterId: 1,
  source: "quran"
}
```

## Integration with Existing Player

The Quran SDK integrates seamlessly with the existing music player:

1. **Search**: Use existing search functionality to find reciters and surahs
2. **Playback**: Audio URLs work with existing player components
3. **Playlists**: Create playlists of surahs and recitations
4. **Sync**: Works with existing cross-device synchronization
5. **Themes**: Uses existing theme system
6. **Settings**: Integrates with existing settings

## Error Handling

All functions include proper error handling:

```javascript
try {
  const audio = await musicSdk.getQuranAudio(1, 1, '320k')
  // Use audio
} catch (error) {
  console.error('Error getting audio:', error)
  // Handle error
}
```

## Quality Support

The API supports multiple audio qualities:
- **128k**: Standard quality
- **320k**: High quality
- **FLAC**: Lossless quality

## Rate Limiting

The Quran.com API has rate limits. The SDK includes:
- Request queuing
- Error handling for rate limits
- Automatic retry logic

## Future Enhancements

- **Translations**: Support for multiple language translations
- **Tafsir**: Commentary integration
- **Bookmarks**: Save favorite verses and surahs
- **Offline**: Cache audio for offline listening
- **Progress**: Track listening progress
- **Favorites**: Mark favorite reciters and surahs

## Troubleshooting

### Common Issues

1. **Audio not found**: Check if reciter and surah combination exists
2. **Network errors**: Check internet connection and API availability
3. **Rate limiting**: Implement delays between requests

### Debug Mode

Enable debug logging:
```javascript
// Set debug mode in your application
window.DEBUG_QURAN_SDK = true
```

## Support

For issues with the Quran SDK integration:
1. Check the console for error messages
2. Verify API endpoints are accessible
3. Check network connectivity
4. Review the example usage files
