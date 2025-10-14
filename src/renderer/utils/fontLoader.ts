/**
 * Font loading utility for Quran fonts
 */

export class FontLoader {
  private static loadedFonts = new Set<string>()

  static async loadQuranFonts(): Promise<void> {
    const fonts = [
      {
        family: 'QPC-Uthmanic-Hafs',
        sources: [
          {
            url: '/static/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2',
            format: 'woff2'
          },
          {
            url: '/static/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.ttf',
            format: 'truetype'
          }
        ]
      },
      {
        family: 'NotoNaskhArabic',
        sources: [
          {
            url: '/static/fonts/lang/arabic/NotoNaskhArabic-Regular.woff2',
            format: 'woff2'
          },
          {
            url: '/static/fonts/lang/arabic/NotoNaskhArabic-Regular.ttf',
            format: 'truetype'
          }
        ]
      }
    ]

    const loadPromises = fonts.map(font => this.loadFont(font.family, font.sources))
    await Promise.all(loadPromises)
  }

  private static async loadFont(family: string, sources: Array<{url: string, format: string}>): Promise<void> {
    if (this.loadedFonts.has(family)) {
      return
    }

    try {
      const fontFace = new FontFace(family, sources.map(s => `url(${s.url}) format('${s.format}')`).join(', '))
      await fontFace.load()
      document.fonts.add(fontFace)
      this.loadedFonts.add(family)
      console.log(`✅ Loaded font: ${family}`)
    } catch (error) {
      console.error(`❌ Failed to load font: ${family}`, error)
    }
  }

  static isFontLoaded(family: string): boolean {
    return this.loadedFonts.has(family)
  }
}
