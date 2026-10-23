import { ref, watchEffect } from 'vue'
import { inBrowser } from 'vitepress'

type Lang = 'zh' | 'en'

const STORAGE_KEY = 'hello-agents-lang'

const lang = ref<Lang>('zh')

if (inBrowser) {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'zh') lang.value = saved
}

function set(next: Lang) {
  lang.value = next
}

function toggle() {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
}

if (inBrowser) {
  watchEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang.value)
  })
}

export function useI18nLang() {
  return { lang, set, toggle }
}

