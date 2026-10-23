import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import LanguageSwitch from './LanguageSwitch'
import I18nDoc from './I18nDoc'
import I18nSidebar from './I18nSidebar'
import 'katex/dist/katex.min.css'
import './style.css'
import { inBrowser } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: any) {
    app.component('I18nDoc', I18nDoc)

    if (inBrowser) {
      const hash = window.location.hash
      if (hash.startsWith('#/')) {
        const path = hash.slice(1).split('?')[0].split('#')[0]
        const url = window.location.origin + '/hello-agents' + path
        window.history.replaceState({}, '', url)
      }
    }
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(LanguageSwitch),
      'sidebar-nav-before': () => h(I18nSidebar)
    })
  }
}
