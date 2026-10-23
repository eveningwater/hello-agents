import { defineConfig } from 'vitepress'
import { generateThemeConfigParts } from './nav-gen'
import { katex } from '@mdit/plugin-katex'

const themeParts = generateThemeConfigParts()

// VITEPRESS_BASE 由构建环境传入，用于适配不同部署平台：
//   GitHub Pages + 仓库 hello-agents -> VITEPRESS_BASE=/hello-agents/
//   阿里云 ESA / 独立域名            -> VITEPRESS_BASE=/
// 未设置时默认 /hello-agents/（本地预览和 GitHub Pages 默认）
const base = process.env.VITEPRESS_BASE ?? '/hello-agents/'

export default defineConfig({
  srcDir: '.vitepress/__content',
  title: 'Hello Agents',
  description: '智能体学习与实践指南',
  base,
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
