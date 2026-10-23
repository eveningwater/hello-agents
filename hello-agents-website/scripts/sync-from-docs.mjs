// 独立脚本：从仓库根目录 docs/ 同步内容到 VitePress __content/
// 绕过 vitepress 加载 config 时的时序问题
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const websiteRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(websiteRoot, '..')
const sourceDocsDir = path.resolve(repoRoot, 'docs')
const vitepressDir = path.join(websiteRoot, 'docs', '.vitepress')
const docsDir = path.join(websiteRoot, 'docs')
const contentDir = path.join(vitepressDir, '__content')
const i18nSrcDir = path.join(contentDir, '.i18n_src')
const contentImagesDir = path.join(contentDir, 'images')

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }) }
function rmDir(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }) }
function listDir(p) { return fs.readdirSync(p, { withFileTypes: true }) }
function hasCjk(s) { return /[\u4e00-\u9fff]/.test(s) }
function isChapterDir(n) { return /^chapter\d+$/i.test(n) }
function chapterSortKey(n) {
  const m = n.match(/^chapter(\d+)$/i)
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY
}
function isEnglishMd(n) {
  return /^Chapter\d+/i.test(n) || (!hasCjk(n) && n.toLowerCase().endsWith('.md'))
}
function shouldCopyFile(n) {
  const ext = path.extname(n).toLowerCase()
  if (['.md', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return true
  return false
}

function rewriteGitHubImageUrls(md) {
  let out = md
  const pats = [
    /https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/docs\/images\/([^\s"'()]+)(?![^\s"'()])/g,
    /https?:\/\/github\.com\/[^/]+\/[^/]+\/raw\/[^/]+\/docs\/images\/([^\s"'()]+)(?![^\s"'()])/g,
    /https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/docs\/images\/([^\s"'()]+)(?![^\s"'()])/g,
  ]
  for (const re of pats) {
    out = out.replace(re, (_full, rel) => {
      const local = path.join(contentImagesDir, rel)
      if (!fs.existsSync(local)) return _full
      return `../../images/${rel}`
    })
  }
  return out
}

function sanitizeMd(md) {
  // 修复 upstream typo: ttps:// -> https://
  md = md.replace(/ttps:\/\//g, 'https://')

  const blocks = []
  const lines = md.split('\n')
  let buf = []
  let inFence = false
  const flush = (type) => {
    if (!buf.length) return
    blocks.push({ type, text: buf.join('\n') + '\n' })
    buf = []
  }
  for (const line of lines) {
    const trimmed = line.trimStart()
    const isFence = trimmed.startsWith('```')
    if (isFence) {
      if (inFence) { buf.push(line); flush('fence'); inFence = false; continue }
      flush('text'); buf.push(line); inFence = true; continue
    }
    buf.push(line)
  }
  flush(inFence ? 'fence' : 'text')

  const transform = (t) => {
    let o = t
    o = o.replace(/{{/g, '&#123;&#123;').replace(/}}/g, '&#125;&#125;')
    o = o.replace(/<\/?(background_information|instructions)>/g, (m) => m.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    o = o.replace(/<\/?strong>/g, '**')
    o = o.replace(/<br\s*\/?>/gi, '\n')
    o = o.replace(/<div[^>]*>/gi, '\n\n').replace(/<\/div>/gi, '\n\n')
    o = o.replace(/<p[^>]*>/gi, '\n\n').replace(/<\/p>/gi, '\n\n')
    o = o.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/?>/gi, (_f, src) => `![](${src})`)
    return o
  }
  return blocks.map((b) => b.type === 'text' ? transform(b.text) : b.text).join('')
}

function copyTree(src, dst) {
  for (const e of listDir(src)) {
    if (['.vitepress', 'node_modules', '.git'].includes(e.name)) continue
    const ns = path.join(src, e.name)
    const nd = path.join(dst, e.name)
    if (e.isDirectory()) { ensureDir(nd); copyTree(ns, nd); continue }
    if (!e.isFile()) continue
    if (!shouldCopyFile(e.name)) continue
    ensureDir(path.dirname(nd))
    fs.copyFileSync(ns, nd)
  }
}

// 清空 __content 并重建
rmDir(contentDir)
ensureDir(contentDir)
ensureDir(i18nSrcDir)

console.log(`源 docs:   ${sourceDocsDir}`)
console.log(`目标内容:  ${contentDir}`)

// 复制 images
const srcImages = path.join(sourceDocsDir, 'images')
if (fs.existsSync(srcImages)) {
  console.log('→ 复制 images/ ...')
  copyTree(srcImages, contentImagesDir)
  const imgCount = fs.readdirSync(contentImagesDir, { recursive: true }).filter((f) => !f.endsWith('/')).length
  console.log(`  images: ${imgCount} 个文件`)
}

// 处理 chapters
console.log('→ 处理 chapters ...')
const chapterDirs = listDir(sourceDocsDir)
  .filter((e) => e.isDirectory() && isChapterDir(e.name))
  .map((e) => e.name)
  .sort((a, b) => chapterSortKey(a) - chapterSortKey(b))

let firstLink
for (const ch of chapterDirs) {
  const srcCh = path.join(sourceDocsDir, ch)
  const mds = listDir(srcCh)
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map((e) => e.name)
    .sort()

  const zhFile = mds.find((f) => hasCjk(f))
  const enFile = mds.find((f) => isEnglishMd(f) && !hasCjk(f))

  if (zhFile) {
    const src = fs.readFileSync(path.join(srcCh, zhFile), 'utf8')
    const processed = sanitizeMd(rewriteGitHubImageUrls(src))
    const target = path.join(i18nSrcDir, ch, zhFile)
    ensureDir(path.dirname(target))
    fs.writeFileSync(target, processed, 'utf8')
  }
  if (enFile) {
    const src = fs.readFileSync(path.join(srcCh, enFile), 'utf8')
    const processed = sanitizeMd(rewriteGitHubImageUrls(src))
    const target = path.join(i18nSrcDir, ch, enFile)
    ensureDir(path.dirname(target))
    fs.writeFileSync(target, processed, 'utf8')
  }

  if (!zhFile && !enFile) continue

  const indexContent = `---\n---\n<I18nDoc zhRel="${ch}/${zhFile || ''}" enRel="${ch}/${enFile || ''}" />\n`
  const wrapper = path.join(contentDir, ch, 'index.md')
  ensureDir(path.dirname(wrapper))
  fs.writeFileSync(wrapper, indexContent, 'utf8')

  if (!firstLink) firstLink = `/${ch}/`
}

// 生成首页
const zhHome = `# Hello Agents\n\n- [开始阅读](${encodeURI(firstLink || '/')})\n`
const enHome = `# Hello Agents\n\n- [Start Reading](${encodeURI(firstLink || '/')})\n`
fs.writeFileSync(path.join(i18nSrcDir, 'index.zh.md'), zhHome, 'utf8')
fs.writeFileSync(path.join(i18nSrcDir, 'index.en.md'), enHome, 'utf8')
fs.writeFileSync(
  path.join(contentDir, 'index.md'),
  `---\n---\n<I18nDoc zhRel="index.zh.md" enRel="index.en.md" />\n`,
  'utf8'
)

// 输出统计
const mdCount = fs.readdirSync(i18nSrcDir, { recursive: true }).filter((f) => f.endsWith('.md')).length
console.log(`  md 文件: ${mdCount} 个`)
console.log('✓ 同步完成')
