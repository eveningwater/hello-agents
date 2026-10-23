# 静态文档网站

一个使用 **VitePress** 构建的现代化、高性能的静态文档网站，支持完整的 Markdown 功能和开箱即用的部署。

## 特性

✨ **核心特性**
- ⚡️ 极快的开发和构建速度（基于 Vite）
- 📝 完整的 Markdown 支持和代码高亮
- 🎨 现代化的 UI 设计和响应式布局
- 🔍 内置全文搜索功能
- 🚀 一键部署，输出纯静态 HTML 文件
- 📱 完整的移动端支持
- 🌙 深色模式支持

## 快速开始

### 前置条件

- Node.js >= 16.0.0
- npm 或 yarn

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

访问 `http://localhost:5173` 查看文档网站。

## 项目结构

```
.
├── docs/                      # 文档源文件目录
│   ├── .vitepress/           # VitePress 配置
│   │   ├── config.mts        # 主配置文件
│   │   └── theme/            # 主题配置
│   ├── index.md              # 首页
│   ├── guide/                # 入门指南
│   │   ├── introduction.md
│   │   ├── installation.md
│   │   └── quickstart.md
│   ├── api/                  # API 文档
│   │   ├── overview.md
│   │   ├── core.md
│   │   └── utilities.md
│   └── examples/             # 示例代码
│       ├── getting-started.md
│       └── advanced.md
├── package.json              # 项目配置
└── README.md                 # 本文件
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（支持热重载） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

## 配置说明

### 主配置文件

编辑 `docs/.vitepress/config.mts` 来配置：

- **网站信息**：标题、描述、基础路径
- **导航菜单**：顶部菜单栏
- **侧边栏**：各页面的导航菜单
- **社交链接**：GitHub、Twitter 等
- **搜索配置**：全文搜索设置
- **页脚**：版权信息等

### 添加新文档

1. 在相应目录（如 `docs/guide/`）创建 `.md` 文件
2. 在 `config.mts` 中的 `sidebar` 配置中添加新文档的链接

示例：
```typescript
sidebar: {
  '/guide/': [
    {
      text: '入门指南',
      items: [
        { text: '介绍', link: '/guide/introduction' },
        { text: '新文档', link: '/guide/new-doc' }  // 新增
      ]
    }
  ]
}
```

## 部署

### 部署到 GitHub Pages

```bash
npm run build
# 上传 docs/.vitepress/dist 目录内容
```

### 部署到 Netlify / Vercel

1. 连接 Git 仓库
2. 设置构建命令：`npm run build`
3. 设置发布目录：`docs/.vitepress/dist`

### 部署到自己的服务器

```bash
npm run build
scp -r docs/.vitepress/dist/* user@server:/var/www/docs
```

详见 [部署指南](./docs/examples/advanced.md#部署指南)

## 支持的 Markdown 特性

- ✅ 标题、列表、表格、代码块
- ✅ 代码块语法高亮（支持 50+ 种语言）
- ✅ 提示块（tip, warning, danger）
- ✅ 容器组件
- ✅ 脚注
- ✅ 任务列表
- ✅ Emoji 表情

## 技术栈

- **VitePress** - 文档生成框架
- **Vite** - 构建工具
- **Vue 3** - 前端框架
- **Markdown-it** - Markdown 解析器

## 浏览器兼容性

支持所有现代浏览器：
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT

## 支持和反馈

如有任何问题或建议，欢迎提出 Issue 或 Pull Request。

## 更多资源

- [VitePress 官方文档](https://vitepress.dev)
- [Markdown 语法指南](https://vitepress.dev/guide/markdown)
- [部署指南](https://vitepress.dev/guide/deploy)
