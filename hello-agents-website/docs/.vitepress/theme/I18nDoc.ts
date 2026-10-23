import { defineComponent, h, computed } from 'vue'
import { useData } from 'vitepress'
import { useI18nLang } from './i18n'

const mdModules = (import.meta as any).glob('../__content/.i18n_src/**/*.md', { eager: true })

function getMdComponent(rel: string | undefined) {
  if (!rel) return undefined
  const key = `../__content/.i18n_src/${rel}`.replace(/\\/g, '/')
  const mod = (mdModules as any)[key]
  return mod?.default
}

export default defineComponent({
  name: 'I18nDoc',
  props: {
    zhRel: { type: String, required: false, default: '' },
    enRel: { type: String, required: false, default: '' }
  },
  setup(props) {
    const { page, theme } = useData()
    const { lang } = useI18nLang()

    const resolved = computed(() => {
      const rel = page.value.relativePath
      const map = (theme.value as any)?.i18nPageMap as
        | Record<string, { zhRel?: string; enRel?: string }>
        | undefined

      if (map && rel && map[rel]) return map[rel]

      const zhRel = props.zhRel || undefined
      const enRel = props.enRel || undefined
      return { zhRel, enRel }
    })

    const component = computed(() => {
      const { zhRel, enRel } = resolved.value
      const prefer = lang.value === 'zh' ? zhRel : enRel
      const fallback = lang.value === 'zh' ? enRel : zhRel
      return getMdComponent(prefer) ?? getMdComponent(fallback)
    })

    return () => {
      const Comp = component.value
      if (!Comp) return null
      return h(Comp)
    }
  }
})
