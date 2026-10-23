import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export type ThemeNavItem = { text: string; link: string }
export type ThemeSidebarItem = { text: string; link: string }
export type ThemeSidebarGroup = { text: string; items: ThemeSidebarItem[] }

type ThemeConfigParts = {
  nav: ThemeNavItem[]
  sidebar: ThemeSidebarGroup[]
  i18nSidebar: {
    zh: ThemeSidebarGroup[]
    en: ThemeSidebarGroup[]
  }
  i18nPageMap: Record<
    string,
    {
      zhRel?: string
      enRel?: string
    }
  >
  githubUrl?: string
}

function getPaths() {
  const vitepressDir = path.dirname(fileURLToPath(import.meta.url))
  const docsDir = path.resolve(vitepressDir, '..')
  const externalDocsDir = path.resolve(vitepressDir, '../../../docs')
  const contentDir = path.resolve(vitepressDir, '__content')
  const i18nSrcDir = path.resolve(contentDir, '.i18n_src')
  return { vitepressDir, docsDir, externalDocsDir, contentDir, i18nSrcDir }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function rmDirIfExists(dirPath: string) {
  if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true })
}

function rmDocsChildrenExceptVitepress(docsDir: string) {
  if (!fs.existsSync(docsDir)) return
  for (const entry of listDirEntries(docsDir)) {
    if (entry.name === '.vitepress') continue
    fs.rmSync(path.join(docsDir, entry.name), { recursive: true, force: true })
  }
}

function listDirEntries(dirPath: string) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
}

function shouldSkipDir(name: string) {
  if (name === '.vitepress') return true
  if (name === 'node_modules') return true
  if (name === '.git') return true
  return false
}

function shouldCopyFile(name: string) {
  const baseName = path.basename(name)
  if (baseName === '_sidebar.md') return false
  if (baseName === '_sidebar_en.md') return false
  if (baseName === 'README.md') return false
  if (baseName === 'README_EN.md') return false
  if (baseName === 'Preface.md') return false
  if (baseName === '前言.md') return false

  const ext = path.extname(name).toLowerCase()
  if (ext === '.md') return true
  if (ext === '.png') return true
  if (ext === '.jpg') return true
  if (ext === '.jpeg') return true
  if (ext === '.gif') return true
  if (ext === '.webp') return true
  if (ext === '.svg') return true
  return false
}

function copyDocsFiles(sourceDir: string, targetDir: string) {
  for (const entry of listDirEntries(sourceDir)) {
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue
      const nextSource = path.join(sourceDir, entry.name)
      const nextTarget = path.join(targetDir, entry.name)
      ensureDir(nextTarget)
      copyDocsFiles(nextSource, nextTarget)
      continue
    }

    if (!entry.isFile()) continue

    if (!shouldCopyFile(entry.name)) continue

    const from = path.join(sourceDir, entry.name)
    const to = path.join(targetDir, entry.name)
    fs.copyFileSync(from, to)
  }
}

function pickSourceDocsDir() {
  const { docsDir, externalDocsDir } = getPaths()
  if (fs.existsSync(path.join(externalDocsDir, '_sidebar.md'))) return externalDocsDir
  return docsDir
}

function hasCjk(input: string) {
  return /[\u4e00-\u9fff]/.test(input)
}

function isChapterDirName(input: string) {
  return /^chapter\d+$/i.test(input)
}

function getChapterSortKey(input: string) {
  const match = input.match(/^chapter(\d+)$/i)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function listChapterDirs(sourceDocsDir: string) {
  return listDirEntries(sourceDocsDir)
    .filter((e) => e.isDirectory() && isChapterDirName(e.name))
    .map((e) => e.name)
    .sort((a, b) => getChapterSortKey(a) - getChapterSortKey(b))
}

function listMarkdownFiles(dirPath: string) {
  return listDirEntries(dirPath)
    .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === '.md')
    .map((e) => e.name)
}

function writeMarkdownFile(targetFilePath: string, contents: string) {
  ensureDir(path.dirname(targetFilePath))
  fs.writeFileSync(targetFilePath, contents, 'utf8')
}

function toI18nSrcRelPath(chapterName: string, fileName: string) {
  return `${chapterName}/${fileName}`
}

function rewriteGitHubImageUrls(markdown: string, opts: { imageRelPrefix: string; contentImagesDir: string }) {
  const prefix = opts.imageRelPrefix

  const patterns: RegExp[] = [
    /https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/docs\/images\/([^\s"'()]+)(?![^\s"'()])/g,
    /https?:\/\/github\.com\/[^/]+\/[^/]+\/raw\/[^/]+\/docs\/images\/([^\s"'()]+)(?![^\s"'()])/g,
    /https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/docs\/images\/([^\s"'()]+)(?![^\s"'()])/g
  ]

  let next = markdown
  for (const re of patterns) {
    next = next.replace(re, (full, rel) => {
      const localPath = path.join(opts.contentImagesDir, rel)
      if (!fs.existsSync(localPath)) return full
      return prefix + rel
    })
  }

  return next
}

function sanitizeMarkdownForVueTemplate(markdown: string) {
  // 修复 upstream 文档中的 typo: ttps:// -> https://
  markdown = markdown.replace(/ttps:\/\//g, 'https://')

  const blocks: Array<{ type: 'text' | 'fence'; text: string }> = []

  const lines = markdown.split('\n')
  let current: string[] = []
  let inFence = false

  const flush = (type: 'text' | 'fence') => {
    if (!current.length) return
    blocks.push({ type, text: current.join('\n') + '\n' })
    current = []
  }

  for (const line of lines) {
    const trimmed = line.trimStart()
    const isFence = trimmed.startsWith('```')

    if (isFence) {
      if (inFence) {
        current.push(line)
        flush('fence')
        inFence = false
        continue
      }
      flush('text')
      current.push(line)
      inFence = true
      continue
    }

    current.push(line)
  }

  flush(inFence ? 'fence' : 'text')

  const transformText = (input: string) => {
    let out = input

    out = out.replace(/{{/g, '&#123;&#123;').replace(/}}/g, '&#125;&#125;')

    out = out.replace(/<\/?(background_information|instructions)>/g, (m) => {
      return m.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    })

    out = out.replace(/<\/?strong>/g, '**')
    out = out.replace(/<br\s*\/?>/gi, '\n')

    out = out.replace(/<div[^>]*>/gi, '\n\n')
    out = out.replace(/<\/div>/gi, '\n\n')
    out = out.replace(/<p[^>]*>/gi, '\n\n')
    out = out.replace(/<\/p>/gi, '\n\n')

    out = out.replace(
      /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/?>/gi,
      (_full, src) => `![](${src})`
    )

    return out
  }

  return blocks.map((b) => (b.type === 'text' ? transformText(b.text) : b.text)).join('')
}

function syncContentFromSource() {
  const { docsDir, contentDir, i18nSrcDir } = getPaths()
  const sourceDocsDir = pickSourceDocsDir()

  rmDocsChildrenExceptVitepress(docsDir)
  rmDirIfExists(contentDir)
  ensureDir(contentDir)
  rmDirIfExists(i18nSrcDir)
  ensureDir(i18nSrcDir)

  const imagesDir = path.join(sourceDocsDir, 'images')
  if (fs.existsSync(imagesDir)) {
    copyDocsFiles(imagesDir, path.join(contentDir, 'images'))
  }
  const contentImagesDir = path.join(contentDir, 'images')

  let firstLink: string | undefined

  for (const chapterName of listChapterDirs(sourceDocsDir)) {
    const sourceChapterDir = path.join(sourceDocsDir, chapterName)
    const mdFiles = listMarkdownFiles(sourceChapterDir).filter(shouldCopyFile).sort()

    const zhFile = mdFiles.find((f) => hasCjk(f))
    const enFile = mdFiles.find((f) => isEnglishChapterFile(f) && !hasCjk(f))

    if (zhFile) {
      const target = path.join(i18nSrcDir, chapterName, zhFile)
      ensureDir(path.dirname(target))
      const src = fs.readFileSync(path.join(sourceChapterDir, zhFile), 'utf8')
      const rewritten = rewriteGitHubImageUrls(src, { imageRelPrefix: '../../images/', contentImagesDir })
      const sanitized = sanitizeMarkdownForVueTemplate(rewritten)
      fs.writeFileSync(target, sanitized, 'utf8')
    }

    if (enFile) {
      const target = path.join(i18nSrcDir, chapterName, enFile)
      ensureDir(path.dirname(target))
      const src = fs.readFileSync(path.join(sourceChapterDir, enFile), 'utf8')
      const rewritten = rewriteGitHubImageUrls(src, { imageRelPrefix: '../../images/', contentImagesDir })
      const sanitized = sanitizeMarkdownForVueTemplate(rewritten)
      fs.writeFileSync(target, sanitized, 'utf8')
    }

    if (!zhFile && !enFile) continue

    const wrapperPath = path.join(contentDir, chapterName, 'index.md')
    const zhRel = zhFile ? toI18nSrcRelPath(chapterName, zhFile) : ''
    const enRel = enFile ? toI18nSrcRelPath(chapterName, enFile) : ''
    writeMarkdownFile(
      wrapperPath,
      `---\n---\n<I18nDoc zhRel="${zhRel}" enRel="${enRel}" />\n`
    )

    if (!firstLink) firstLink = `/${chapterName}/`
  }

  const indexPath = path.join(contentDir, 'index.md')
  const indexTarget = firstLink ?? '/'

  writeMarkdownFile(
    path.join(i18nSrcDir, 'index.zh.md'),
    `# Hello Agents\n\n- [开始阅读](${encodeURI(indexTarget)})\n`
  )
  writeMarkdownFile(
    path.join(i18nSrcDir, 'index.en.md'),
    `# Hello Agents\n\n- [Start Reading](${encodeURI(indexTarget)})\n`
  )

  writeMarkdownFile(indexPath, `---\n---\n<I18nDoc zhRel="index.zh.md" enRel="index.en.md" />\n`)
}

function toRouteFromFile(chapterName: string, fileName: string) {
  return encodeURI(`/${chapterName}/${fileName.replace(/\.md$/i, '')}`)
}

function findGitHubUrlFromReadme(readmeMd: string) {
  const match = readmeMd.match(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i)
  return match?.[0]
}

function isEnglishChapterFile(fileName: string) {
  return /^Chapter\d+/i.test(fileName) || (!hasCjk(fileName) && fileName.toLowerCase().endsWith('.md'))
}

function buildI18nSidebarAndPageMap() {
  const sourceDocsDir = pickSourceDocsDir()

  const zhItems: ThemeSidebarItem[] = []
  const enItems: ThemeSidebarItem[] = []
  const i18nPageMap: ThemeConfigParts['i18nPageMap'] = {}

  for (const chapterName of listChapterDirs(sourceDocsDir)) {
    const chapterDir = path.join(sourceDocsDir, chapterName)
    const mdFiles = listMarkdownFiles(chapterDir).filter(shouldCopyFile).sort()

    const zhFile = mdFiles.find((f) => hasCjk(f))
    const enFile = mdFiles.find((f) => isEnglishChapterFile(f) && !hasCjk(f))
    if (!zhFile && !enFile) continue
    const wrapperRoute = encodeURI(`/${chapterName}/`)

    if (zhFile) {
      const base = zhFile.replace(/\.md$/i, '')
      zhItems.push({ text: base, link: wrapperRoute })
    }

    if (enFile) {
      const base = enFile.replace(/\.md$/i, '').replace(/-/g, ' ')
      enItems.push({ text: base, link: wrapperRoute })
    }

    const wrapperRel = `${chapterName}/index.md`
    i18nPageMap[wrapperRel] = {
      zhRel: zhFile ? toI18nSrcRelPath(chapterName, zhFile) : undefined,
      enRel: enFile ? toI18nSrcRelPath(chapterName, enFile) : undefined
    }
  }

  const zh: ThemeSidebarGroup[] = [{ text: '目录', items: zhItems }]
  const en: ThemeSidebarGroup[] = [{ text: 'Chapters', items: enItems }]

  return { i18nSidebar: { zh, en }, i18nPageMap }
}

export function generateThemeConfigParts() {
  const { contentDir } = getPaths()
  const force = process.env.FORCE_SYNC === '1'
  const needsSync = force || !fs.existsSync(contentDir)

  if (needsSync) {
    syncContentFromSource()
  }

  const { externalDocsDir } = getPaths()
  const externalReadmePath = path.join(externalDocsDir, 'README.md')
  const readmeMd = fs.existsSync(externalReadmePath) ? fs.readFileSync(externalReadmePath, 'utf8') : ''
  const githubUrl = readmeMd ? findGitHubUrlFromReadme(readmeMd) : undefined

  const { i18nSidebar, i18nPageMap } = buildI18nSidebarAndPageMap()

  return {
    nav: [{ text: '首页', link: '/' }, ...(githubUrl ? [{ text: 'GitHub', link: githubUrl }] : [])],
    sidebar: i18nSidebar.zh,
    i18nSidebar,
    i18nPageMap,
    githubUrl
  }
}
