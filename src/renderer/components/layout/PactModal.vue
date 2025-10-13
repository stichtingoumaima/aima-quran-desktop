<template>
  <material-modal :show="!isAgreePact || isShowPact" max-width="70%" :bg-close="isAgreePact" :close-btn="isAgreePact" @close="handleClose(false)">
    <main :class="$style.main">
      <h2>许可协议</h2>
      <div class="select scroll" :class="$style.content">
        <template v-if="!isAgreePact"><p><strong>在使用本软件前，你（使用者）需签署本协议才可继续使用！</strong></p><br></template>
        <p>本项目基于&nbsp;<strong class="hover underline" @click="openUrl('http://www.apache.org/licenses/LICENSE-2.0')">Apache License 2.0</strong>&nbsp;许可证发行。以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。</p><br>
        <p>词语约定：本协议中的"本项目"指 AIMA Quran Desktop 项目；"使用者"指签署本协议的使用者；"古兰经资源"指本应用程序中可用的古兰经诵读源和翻译；"版权数据"指包括但不限于音频诵读、翻译等在内的他人拥有所属版权的数据。</p><br>
        <p><strong>一、数据来源</strong></p><br>
        <p>1.1&nbsp;本项目中的古兰经诵读和翻译来源于公开的伊斯兰资源和API。本项目不对内容的准确性或真实性负责。</p><br>
        <p>1.2&nbsp;本项目不直接托管或存储古兰经音频文件。音频内容从外部源流式传输。项目无法保证这些外部源的可用性或质量。</p><br>
        <p>1.3&nbsp;任何用户生成的内容或本地数据由用户负责。本项目不对用户提供数据的合法性或准确性负责。</p><br>
        <p><strong>二、版权数据</strong></p><br>
        <p>2.1&nbsp;使用本项目的过程中可能会访问版权数据。对于这些版权数据，本项目不拥有它们的所有权。用户必须尊重古兰经诵读者、翻译者和其他内容创作者的版权。</p><br>
        <p><strong>三、宗教内容</strong></p><br>
        <p>3.1&nbsp;本项目专为教育和宗教目的而设计。用户应尊重地使用此应用程序，并符合伊斯兰原则。</p><br>
        <p><strong>四、资源使用</strong></p><br>
        <p>4.1&nbsp;本项目内使用的部分包括但不限于字体、图片等资源来源于互联网。如果出现侵权可联系本项目移除。</p><br>
        <p><strong>五、免责声明</strong></p><br>
        <p>5.1&nbsp;由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。</p><br>
        <p><strong>六、使用限制</strong></p><br>
        <p>6.1&nbsp;本项目完全免费，且开源发布于&nbsp;<span class="hover underline" @click="openUrl('https://github.com/ayma/aima-quran-desktop#readme')">GitHub</span>&nbsp;面向全世界人用作教育和宗教目的。本项目不对项目内的技术可能存在违反当地法律法规的行为作保证。</p><br>
        <p>6.2&nbsp;用户全权负责确保其对本项目的使用符合当地法律法规。</p><br>
        <p><strong>七、版权保护</strong></p><br>
        <p>7.1&nbsp;请尊重古兰经诵读者、翻译者和其他内容创作者的版权。支持合法的伊斯兰内容提供商。</p><br>
        <p><strong>八、非商业性质</strong></p><br>
        <p>8.1&nbsp;本项目专为教育和宗教目的而设计，不接受商业合作或捐赠。</p><br>
        <p><strong>九、接受协议</strong></p><br>
        <p>9.1&nbsp;若你使用了本项目，即代表你接受本协议。</p><br>
        <p><strong>*</strong>&nbsp;若协议更新，恕不另行通知，可到开源地址查看。</p>
        <p v-if="!isAgreePact"><strong>若你（使用者）接受以上协议，请点击下面的“接受”按钮签署本协议，若不接受，请点击“不接受”后退出软件并清除本软件的所有数据。</strong></p>
      </div>
      <div v-if="!isAgreePact" :class="$style.btns">
        <base-btn :class="$style.btn" @click="handleClose(true)">{{ $t('not_agree') }}</base-btn>
        <base-btn :class="$style.btn" :disabled="!btnEnable" @click="handleClick">{{ $t('agree') }} {{ timeStr }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { checkUpdate, quitApp } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { isShowPact } from '@renderer/store'
import { appSetting, saveAgreePact } from '@renderer/store/setting'
import { computed } from '@common/utils/vueTools'

export default {
  setup() {
    const isAgreePact = computed(() => appSetting['common.isAgreePact'])

    return {
      isShowPact,
      isAgreePact,
      appSetting,
    }
  },
  data() {
    return {
      time: 20,
    }
  },
  computed: {
    btnEnable() {
      return this.time == 0
    },
    timeStr() {
      return this.btnEnable ? '' : `(${this.time})`
    },
  },
  watch: {
    isAgreePact(n) {
      if (n) return
      this.time = 5
      this.startTimeout()
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (!this.isAgreePact) {
        this.startTimeout()
      }
    })
  },
  methods: {
    handleClick() {
      saveAgreePact(true)
      window.setTimeout(() => {
        this.$dialog({
          message: Buffer.from('41494d4120517572616e20506c6179657220697320636f6d706c6574656c79206672656520616e64206f70656e20736f757263652e20496620796f75207061696420666f72207468697320736f6674776172652c20706c65617365206c656176652061206e6567617469766520726576696577210a0a5468697320736f667477617265206973206672656520616e64206f70656e20736f757263652e', 'hex').toString(),
          confirmButtonText: Buffer.from('4f4b', 'hex').toString(),
        }).then(() => {
          checkUpdate()
        })
      }, 2e3)
    },
    handleClose(isExit) {
      if (isExit) {
        quitApp(true)
        return
      }
      isShowPact.value = false
    },
    openUrl(url) {
      void openUrl(url)
    },
    startTimeout() {
      window.setTimeout(() => {
        if (--this.time > 0) this.startTimeout()
      }, 1e3)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px 8px 12px;
  min-width: 200px;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  h2 {
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
  }
}

.content {
  flex: auto;
  margin: 15px 0;
  padding: 0 7px;
  h3 {
    font-weight: bold;
    line-height: 2;
  }
  p {
    line-height: 1.5;
    font-size: 14px;
    text-align: justify;
  }
}

.btns {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn {
  display: block;
  width: 48%;
  &:last-child {
    margin-bottom: 0;
  }
}


</style>
