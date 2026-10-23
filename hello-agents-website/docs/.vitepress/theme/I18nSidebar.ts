import { defineComponent, h, computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import { VPLink } from 'vitepress/theme'
import { useI18nLang } from './i18n'

export default defineComponent({
  name: 'I18nSidebar',
  setup() {
    const { theme } = useData()
    const route = useRoute()
    const { lang } = useI18nLang()

    const groups = computed(() => {
      const i18nSidebar = (theme.value as any)?.i18nSidebar as { zh?: any; en?: any } | undefined
      return lang.value === 'zh' ? i18nSidebar?.zh ?? [] : i18nSidebar?.en ?? []
    })

    const activePath = computed(() => route.path)

    return () =>
      h('div', { class: 'HelloAgentsI18nSidebar' }, [
        ...groups.value.map((group: any) =>
          h('div', { class: 'HelloAgentsI18nSidebarGroup' }, [
            h('div', { class: 'HelloAgentsI18nSidebarGroupTitle' }, group.text),
            h(
              'div',
              { class: 'HelloAgentsI18nSidebarGroupItems' },
              group.items.map((item: any) =>
                h(
                  'div',
                  { class: 'HelloAgentsI18nSidebarItem' },
                  h(
                    VPLink,
                    {
                      href: item.link,
                      class: ['HelloAgentsI18nSidebarLink', activePath.value === item.link ? 'is-active' : '']
                    },
                    { default: () => item.text }
                  )
                )
              )
            )
          ])
        )
      ])
  }
})

