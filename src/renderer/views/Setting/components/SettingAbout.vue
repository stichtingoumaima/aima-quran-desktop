<template lang="pug">
dt#about {{ $t('setting__about') }}
dd
  .p.small
    | AIMA Quran Player is a free and open-source desktop application for listening to Quran recitations.
  .p.small
    | Features multiple reciters, translations, and a clean, user-friendly interface.
  br
  .p.small
    | Open source project:
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/ayma/aima-quran-desktop#readme')") https://github.com/ayma/aima-quran-desktop
  .p.small
    | Latest releases:
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/ayma/aima-quran-desktop/releases')") GitHub Releases
  .p.small
    | Report issues:
    span.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/ayma/aima-quran-desktop/issues')") GitHub Issues
  br
  .p.small
    | This software is completely free and open source. The project is maintained for educational and research purposes.
  .p.small
    | Only GitHub is the official release channel. Other sources may not be trustworthy.
  br
  .p.small
    | You have agreed to the software's
    base-btn(min @click="handleShowPact") License Agreement
    | , available online
    strong.hover.underline(:aria-label="$t('setting__click_open')" @click="openUrl('https://github.com/ayma/aima-quran-desktop#license')") here
    | .
  br
  .p.small
    | By:&nbsp;
    strong AIMA Team
</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { isShowPact } from '@renderer/store'
import { openUrl, clipboardWriteText } from '@common/utils/electron'

export default {
  name: 'SettingAbout',
  setup() {
    const handleShowPact = () => {
      isShowPact.value = true
    }
    return {
      openUrl,
      clipboardWriteText,
      handleShowPact,
    }
  },
}
</script>
