import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const outDir = path.join(projectRoot, 'hello-agents')
const zipPath = path.join(projectRoot, 'hello-agents.zip')

if (!fs.existsSync(outDir) || !fs.statSync(outDir).isDirectory()) {
  console.error(`未找到构建目录: ${outDir}`)
  process.exit(1)
}

if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true })

const zip = spawnSync('zip', ['-qr', zipPath, 'hello-agents'], {
  cwd: projectRoot,
  stdio: 'inherit'
})

if (zip.status !== 0) {
  process.exit(zip.status ?? 1)
}

fs.rmSync(outDir, { recursive: true, force: true })

