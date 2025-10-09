# YouTube Music SDK for Quran Recitations

This SDK provides YouTube Music integration for Quran recitations in the LX Music Desktop application.

## Features

- **Audio Streaming**: Direct audio stream URLs from YouTube videos
- **Search**: Search for Quran recitations by reciter name, surah name, or keywords
- **Playlists**: Support for YouTube playlists containing Quran recitations
- **Popular Content**: Curated list of popular Quran YouTube playlists and channels
- **Hot Search**: Trending search terms for Quran recitations

## Architecture

The SDK follows the same pattern as other music sources in the application:

- `api-test.js` - Handles audio URL extraction using play-dl
- `musicSearch.js` - YouTube video search functionality
- `songList.js` - YouTube playlist management
- `leaderboard.js` - Popular Quran content
- `hotSearch.js` - Trending search terms
- `comment.js` - Comments (stub implementation)
- `utils.js` - Helper functions for text processing and validation
- `index.js` - Main SDK exports and initialization

## Usage

The YouTube source is automatically registered in the main music SDK and can be used like any other source:

```javascript
// Search for Quran recitations
const results = await musicSdk.youtube.musicSearch.search('mishary rashid surah al fatiha')

// Get playlist videos
const playlist = await musicSdk.youtube.songList.getListDetail('playlist_id')

// Get audio URL
const audioUrl = await musicSdk.youtube.getMusicUrl(songInfo, 'mp4')
```

## Dependencies

- `play-dl`: For YouTube video search and audio stream extraction

## Quality Support

- 128k (default)
- 192k (high quality)

## Notes

- YouTube streams expire after ~6 hours, so URLs need to be refreshed
- The SDK filters results to only show Quran-related content
- Popular playlists are curated manually for better user experience
- Comments functionality is disabled as YouTube doesn't provide easy access to comments via unofficial APIs
