/**
 * Walks HTML strings in content/seo-blog-articles.ts and validates internal links.
 * No TS runtime import (avoids ESM/tooling friction). Run: npm run blog:audit-links
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seoPath = path.join(__dirname, '../content/seo-blog-articles.ts')
const src = fs.readFileSync(seoPath, 'utf8')

const HREF_RE = /href\s*=\s*"([^"]+)"/gi
/** Factory rows inside rawSeoBlogArticles array — two-space indent calls only */
const BLOCK_HEADER_RE =
  /\n {2}(?:article|artistSpotlight|cityGuide)\(\s*\r?\n\s*'([^']+)'/g

const STORE_PATH_PREFIXES = [
  '/shop/',
  '/limited-edition-street-art-prints',
  '/backlit-art-lamp',
  '/interchangeable-art-prints',
  '/urban-art-prints',
]

function isProbablyInternal(href) {
  if (href.startsWith('//')) return false
  if (href.startsWith('http://') || href.startsWith('https://')) return false
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return false
  return href.startsWith('/')
}

function isSuspicious(href) {
  const h = href.trim().toLowerCase()
  if (h.startsWith('javascript:') || h.startsWith('data:')) return true
  if (h.includes('../') || h.includes('..\\')) return true
  return false
}

function pathAllowed(href) {
  if (href.startsWith('/shop/blog/')) return true
  if (href.startsWith('/shop/artists/')) return true
  if (href.startsWith('/shop/pages/')) return true
  return STORE_PATH_PREFIXES.some((p) => href === p || href.startsWith(`${p}/`) || href.startsWith(p))
}

/** Article starts in file order → slice content spans */
const starts = [...src.matchAll(BLOCK_HEADER_RE)].map((m) => ({
  handle: m[1],
  index: m.index ?? 0,
}))

const handles = new Set(starts.map((s) => s.handle))

const issues = []
let hrefCount = 0

for (let i = 0; i < starts.length; i++) {
  const { handle } = starts[i]
  const from = starts[i].index
  const to = i + 1 < starts.length ? starts[i + 1].index : src.length
  const chunk = src.slice(from, to)

  let match
  HREF_RE.lastIndex = 0
  while ((match = HREF_RE.exec(chunk)) !== null) {
    hrefCount += 1
    const hrefRaw = (match[1] ?? '').trim()
    if (!hrefRaw) continue

    if (isSuspicious(hrefRaw)) {
      issues.push(`${handle}: suspicious href ${hrefRaw}`)
      continue
    }

    if (!isProbablyInternal(hrefRaw)) continue

    const pathOnly = hrefRaw.split('?')[0]?.split('#')[0] ?? hrefRaw
    if (!pathAllowed(pathOnly)) {
      issues.push(`${handle}: internal path not allowlisted: ${pathOnly}`)
    }

    if (pathOnly.startsWith('/shop/blog/')) {
      const rest = pathOnly.slice('/shop/blog/'.length)
      const target = rest.replace(/\/$/, '')
      if (target === '' || target === 'shop/blog') continue
      if (!handles.has(target)) {
        issues.push(`${handle}: broken blog target /shop/blog/${target} (unknown handle)`)
      }
    }
  }
}

if (issues.length > 0) {
  console.error('Blog link audit failed:\n')
  for (const line of issues) console.error(line)
  console.error(`\n${issues.length} issue(s); scanned ${hrefCount} href(s) across ${starts.length} factory blocks in seo-blog-articles.ts.`)
  process.exit(1)
}

console.log(`OK — ${hrefCount} href(s) across ${starts.length} article blocks in seo-blog-articles.ts.`)
