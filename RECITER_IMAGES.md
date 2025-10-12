# Reciter Images Mapping

This document explains how reciter images are mapped and used in the Aima Quran Desktop application.

## Image Files Location

Reciter images are stored in the `src/static/reciters/` directory with the following naming convention:
- Images are named using the reciter ID from the Quran.com API
- File extensions: `.jpg` for most images, `.jpeg` for reciters 2 and 3

## Available Images

The following reciter images are available:
- `1.jpg` - Reciter ID 1
- `2.jpeg` - Reciter ID 2  
- `3.jpeg` - Reciter ID 3
- `4.jpg` - Reciter ID 4
- `5.jpg` - Reciter ID 5
- `6.jpg` - Reciter ID 6
- `7.jpg` - Reciter ID 7
- `9.jpg` - Reciter ID 9
- `10.jpg` - Reciter ID 10
- `12.jpg` - Reciter ID 12
- `161.jpg` - Reciter ID 161

## Implementation

The image mapping is handled by utility functions in `src/renderer/utils/musicSdk/quran/utils.js`:

### `getReciterLocalImage(reciterId)`
- Returns the local image path for a given reciter ID
- Returns `null` if no local image is available for the reciter

### `getReciterImage(reciter)`
- Returns the best available image for a reciter
- Priority order:
  1. API provided `profilePicture`
  2. API provided `coverImage` 
  3. Local image fallback
  4. Empty string if no image available

## Usage

The reciter image functions are used in the following files:
- `src/renderer/utils/musicSdk/quran/songList.js`
- `src/renderer/utils/musicSdk/quran/reciterSearch.js`
- `src/renderer/utils/musicSdk/quran/musicSearch.js`

These functions ensure that reciters always have an image displayed in the UI, falling back to local images when the API doesn't provide them.

## Adding New Images

To add new reciter images:
1. Add the image file to `src/static/reciters/` with the reciter ID as filename
2. Update the `availableImages` array in `getReciterLocalImage()` function
3. Ensure the file extension matches the existing pattern (.jpg or .jpeg)
