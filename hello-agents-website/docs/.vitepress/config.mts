import { defineConfig } from 'vitepress'
import { generateThemeConfigParts } from './nav-gen'
import { katex } from '@mdit/plugin-katex'

const themeParts = generateThemeConfigParts()

export default defineConfig({
  srcDir: '.vitepress/__content',
  title: 'Hello Agents',
  description: '智能体学习与实践指南',
  base: '/hello-agents/',
  outDir: '../hello-agents',
  head: [],

  // 忽略死链接检查，因为文档中可能包含外部引用
  ignoreDeadLinks: true,

  markdown: {
    html: true,
    lineNumbers: false,
    breaks: true,
    config: (md) => {
      md.use(katex, {
        throwOnError: false,
        errorColor: '#ff0000'
      })
    }
  },

  themeConfig: {
    nav: themeParts.nav,
    sidebar: {
      '/': themeParts.sidebar
    },
    socialLinks: [
      ...(themeParts.githubUrl ? [{ icon: 'github', link: themeParts.githubUrl }] : [])
    ],
    i18nSidebar: themeParts.i18nSidebar,
    i18nPageMap: themeParts.i18nPageMap,

    // 页脚
    footer: {
      message: '© 2026 Hello Agents. All rights reserved.',
      copyright: 'Made with ❤️ | 智能体学习文档'
    },

    // 搜索配置
    search: {
      provider: 'local'
    }
  } as any
})
