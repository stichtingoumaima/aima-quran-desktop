<template lang="pug">
material-modal(:show="versionInfo.showModal" max-width="60%" @close="handleClose")
  main(v-if="versionInfo.isLatest" :class="$style.main")
    h2 🎉 Latest Version 🎉
    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 Latest Version: {{ versionInfo.newVersion?.version }}
        h3 Current Version: {{ versionInfo.version }}
        h3 Version Changes:
        pre(:class="$style.desc" v-text="versionInfo.newVersion?.desc")
    div(:class="$style.footer")
      div(:class="$style.btns")
        base-btn(v-if="versionInfo.status == 'checking'" :class="$style.btn" disabled) Checking for updates...
        base-btn(v-else :class="$style.btn" @click="handleCheckUpdate") Recheck for updates
  main(v-else-if="versionInfo.isUnknown" :class="$style.main")
    h2 ❓ Failed to get latest version information ❓
    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 Current Version: {{ versionInfo.version }}
        div(:class="$style.desc")
          p Failed to get update information, possibly due to inability to access GitHub. Please check for updates manually!
          p
            | Check method: Open
            base-btn(min aria-label="Click to open" @click="handleOpenUrl('https://github.com/ayma/aima-quran-desktop/releases')") Software Release Page
            | , check if the
            strong version number
            | released by "Latest" is consistent with the current version ({{ versionInfo.version }}).
          p If consistent, you can ignore this popup and close it directly; otherwise, please manually download the new version to update.
    div(:class="$style.footer")
      div(:class="$style.btns")
        base-btn(v-if="versionInfo.status == 'error'" :class="$style.btn2" @click="handleCheckUpdate") Recheck for updates
        base-btn(v-else :class="$style.btn2" disabled) Checking for updates...
        base-btn(:disabled="disabledIgnoreFailBtn" :class="$style.btn2" @click="handleIgnoreFailTipClick") Don't remind again within a week
  main(v-else-if="versionInfo.status == 'downloaded'" :class="$style.main")
    h2 🚀 Program Update 🚀

    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 Latest Version: {{ versionInfo.newVersion?.version }}
        h3 Current Version: {{ versionInfo.version }}
        h3 Version Changes:
        pre(:class="$style.desc" v-text="versionInfo.newVersion?.desc")
      div(v-if="history.length" :class="[$style.history, $style.desc]")
        h3 History Versions:
        div(v-for="(ver, index) in history" :key="index" :class="$style.item")
          h4 v{{ ver.version }}
          pre(v-text="ver.desc")
    div(:class="$style.footer")
      div(:class="$style.desc")
        p New version has been downloaded.
        p
          | You can choose to
          strong restart and update immediately
          | or
          strong automatically update when closing the program
          | later.
      div(:class="$style.btns")
        base-btn(:class="$style.btn" @click="handleRestartClick") Restart and update immediately
  main(v-else :class="$style.main")
    h2 🌟 New Version Found 🌟
    div.scroll.select(:class="$style.info")
      div(:class="$style.current")
        h3 Latest Version: {{ versionInfo.newVersion?.version }}
        h3 Current Version: {{ versionInfo.version }}
        h3 Version Changes:
        pre(:class="$style.desc" v-text="versionInfo.newVersion?.desc")
      div(v-if="history.length" :class="[$style.history, $style.desc]")
        h3 History Versions:
        div(v-for="(ver, index) in history" :key="index" :class="$style.item")
          h4 v{{ ver.version }}
          pre(v-text="ver.desc")

    div(:class="$style.footer")
      div(:class="$style.desc")
        p A new version has been found. You can choose automatic update or manual update.
        p For manual update, you can go to&nbsp;
          strong.hover.underline(aria-label="Click to open" @click="handleOpenUrl('https://github.com/ayma/aima-quran-desktop/releases')") Software Release Page
          | to download.
        p If you encounter problems, you can read the
          strong.hover.underline(aria-label="Click to open" @click="handleOpenUrl('https://github.com/ayma/aima-quran-desktop#readme')") FAQ
          | .
        p(v-if="progress") Current download progress: {{ progress }}
        p(v-else) &nbsp;
      div(:class="$style.btns")
        base-btn(:class="$style.btn2" @click="handleIgnoreClick") {{ isIgnored ? 'Cancel Ignore' : 'Ignore This Version' }}
        base-btn(v-if="versionInfo.status == 'downloading'" :class="$style.btn2" disabled) Downloading update...
        base-btn(v-else :class="$style.btn2" @click="handleDownloadClick") Download Update
</template>

<script>
import { compareVer, sizeFormate } from '@common/utils'
import { openUrl, clipboardWriteText } from '@common/utils/electron'
import { dialog } from '@renderer/plugins/Dialog'
import { versionInfo } from '@renderer/store'
import { getIgnoreVersion, saveIgnoreVersion, quitUpdate, downloadUpdate, checkUpdate } from '@renderer/utils/ipc'

export default {
  setup() {
    return {
      versionInfo,
    }
  },
  data() {
    return {
      ignoreVersion: null,
      disabledIgnoreFailBtn: true,
    }
  },
  computed: {
    history() {
      if (!this.versionInfo.newVersion?.history) return []
      let arr = []
      let currentVer = this.versionInfo.version
      this.versionInfo.newVersion?.history.forEach(ver => {
        if (compareVer(currentVer, ver.version) < 0) arr.push(ver)
      })

      return arr
    },
    progress() {
      return this.versionInfo.status == 'downloading'
        ? this.versionInfo.downloadProgress
          ? `${this.versionInfo.downloadProgress.percent.toFixed(2)}% - ${sizeFormate(this.versionInfo.downloadProgress.transferred)}/${sizeFormate(this.versionInfo.downloadProgress.total)} - ${sizeFormate(this.versionInfo.downloadProgress.bytesPerSecond)}/s`
          : '处理更新中...'
        : ''
    },
    isIgnored() {
      return this.ignoreVersion == this.versionInfo.newVersion?.version
    },
  },
  created() {
    void getIgnoreVersion().then(version => {
      this.ignoreVersion = version
    })
    this.disabledIgnoreFailBtn = Date.now() - parseInt(localStorage.getItem('update__check_failed_tip') ?? '0') < 7 * 86400000
  },
  methods: {
    handleClose() {
      versionInfo.showModal = false
    },
    handleOpenUrl(url) {
      void openUrl(url)
    },
    handleRestartClick(event) {
      this.handleClose()
      event.target.disabled = true
      quitUpdate()
    },
    handleCopy(text) {
      clipboardWriteText(text)
    },
    async handleIgnoreClick() {
      if (this.isIgnored) {
        saveIgnoreVersion(this.ignoreVersion = null)
        return
      }

      if (this.history.length >= 2) {
        if (await dialog.confirm({
          message: window.i18n.t('update__ignore_tip', { num: this.history.length + 1 }),
          cancelButtonText: window.i18n.t('update__ignore_cancel'),
          confirmButtonText: window.i18n.t('update__ignore_confirm'),
        })) {
          setTimeout(() => {
            void dialog({
              message: window.i18n.t('update__ignore_confirm_tip'),
              confirmButtonText: window.i18n.t('update__ignore_confirm_tip_confirm'),
            })
          }, 500)
          return
        }
      }
      saveIgnoreVersion(this.ignoreVersion = this.versionInfo.newVersion?.version)
      // saveIgnoreVersion(this.versionInfo.newVersion?.version)
      // this.handleClose()
    },
    handleDownloadClick() {
      if (this.isIgnored) saveIgnoreVersion(this.ignoreVersion = null)
      versionInfo.status = 'downloading'
      downloadUpdate()
    },
    handleCheckUpdate() {
      if (this.isIgnored) saveIgnoreVersion(this.ignoreVersion = null)
      versionInfo.status = 'checking'
      versionInfo.reCheck = true
      checkUpdate()
    },
    handleIgnoreFailTipClick() {
      localStorage.setItem('update__check_failed_tip', Date.now().toString())
      this.disabledIgnoreFailBtn = true
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  position: relative;
  padding: 15px 0;
  // max-width: 450px;
  min-width: 300px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  overflow: hidden;
  // overflow-y: auto;
  * {
    box-sizing: border-box;
  }
  h2 {
    flex: 0 0 none;
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
    margin-bottom: 15px;
  }
  h3 {
    font-size: 14px;
    line-height: 1.3;
  }
  pre {
    white-space: pre-wrap;
    text-align: justify;
    margin-top: 10px;
  }
}

.info {
  flex: 1 1 auto;
  font-size: 14px;
  line-height: 1.5;
  overflow-y: auto;
  height: 100%;
  padding: 0 15px;
}
.current {
  > p {
    padding-left: 15px;
  }
}

.desc {
  h3, h4 {
    font-weight: bold;
  }
  h3 {
    padding: 5px 0 3px;
  }
  ul {
    list-style: initial;
    padding-inline-start: 30px;
  }
  p {
    font-size: 14px;
    line-height: 1.5;
  }
}

.history {
  h3 {
    padding-top: 15px;
  }

  .item {
    h3 {
      padding: 5px 0 3px;
    }
    padding: 0 15px;
    + .item {
      padding-top: 15px;
    }
    h4 {
      font-weight: 700;
    }
    > p {
      padding-left: 15px;
    }
  }

}
.footer {
  flex: 0 0 none;
  padding: 0 15px;
  .desc {
    padding-top: 10px;
    font-size: 13px;
    color: var(--color-primary-font);
    line-height: 1.25;

    p {
      font-size: 13px;
      color: var(--color-primary-font);
      line-height: 1.25;
    }
  }
}
.btns {
  display: flex;
  flex-flow: row nowrap;
  gap: 15px;
}

.btn {
  margin-top: 10px;
  display: block;
  width: 100%;
}
.btn2 {
  margin-top: 10px;
  display: block;
  width: 50%;
}

</style>

