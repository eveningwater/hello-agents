import { defineComponent, h } from 'vue'
import { useI18nLang } from './i18n'

export default defineComponent({
  name: 'LanguageSwitch',
  setup() {
    const { lang, toggle } = useI18nLang()

    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'HelloAgentsLanguageSwitch',
          onClick: toggle
        },
        lang.value === 'zh' ? 'English' : '中文'
      )
  }
})
