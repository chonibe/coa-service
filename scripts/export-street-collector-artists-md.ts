import dotenv from 'dotenv'

// Load local env (Vercel pull writes .env.local)
dotenv.config({ path: '.env.local' })

import { streetCollectorContent } from '@/content/street-collector'
import { createClient } from '@/lib/supabase/server'
import { getCollection } from '@/lib/shopify/storefront-client'
import { getVendorMeta } from '@/lib/shopify/vendor-meta'
import { getPage, hasPage, pages as shopifyPages } from '@/content/shopify-content'
import {
  getArtistImageByHandle,
  getCollectionDescription,
  getCollectionInstagram,
} from '@/lib/shopify/artist-image'
import { getVendorBioByHandle } from '@/lib/shopify/vendor-bio'

type FeaturedArtistSeed = (typeof streetCollectorContent.featuredArtists.collections)[number]

function collectionUrlForArtist(seed: FeaturedArtistSeed): string {
  const explicit = 'collectionHref' in seed ? (seed as { collectionHref?: string }).collectionHref : undefined
  return explicit || `https://thestreetcollector.com/collections/${seed.handle}`
}

function titleCaseFromHandle(handle: string): string {
  return handle
    .replace(/-\d+$/, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function mdEscape(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim()
}

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Same fallback used by artist profile API and vendor meta. */
function getBioFromShopifyPage(handle: string): string | undefined {
  const base = handle.replace(/-\d+$/, '')
  const handlesToTry = [handle, base, `${base}-one`].filter(Boolean)
  const unique = [...new Set(handlesToTry)]
  for (const h of unique) {
    const page = hasPage(h) ? getPage(h) : undefined
    if (page?.body?.trim()) return stripHtmlToText(page.body)
  }

  // Fallback: match by Shopify page title (handles cases where handle is numeric but title is artist name).
  const normalizedTitle = base.split('-').join(' ').trim().toLowerCase()
  const normalizedTitleWithDots = normalizedTitle.replace(/\s+/g, '')
  const byTitle = Object.values(shopifyPages).find((p) => {
    const t = p?.title?.trim().toLowerCase()
    if (!t) return false
    if (t === normalizedTitle) return true
    // Handle titles like "Nia.Shtai" vs "nia shtai"
    const tNoSpace = t.replace(/\s+/g, '')
    const tNoPunct = t.replace(/[^\p{L}\p{N}]+/gu, '')
    return tNoSpace === normalizedTitleWithDots || tNoPunct === normalizedTitleWithDots
  })
  if (byTitle?.body?.trim()) return stripHtmlToText(byTitle.body)
  return undefined
}

async function resolveArtist(seed: FeaturedArtistSeed) {
  const handle = seed.handle
  const location = seed.location ?? null
  const collectionUrl = collectionUrlForArtist(seed)

  const collection = await getCollection(handle, { first: 1 }).catch(() => null)
  const nameFromCollection = collection?.title?.trim()
  const vendorNameForMeta = nameFromCollection || titleCaseFromHandle(handle)
  const supabase = createClient()

  const [vendorMeta, image, collectionDesc, vendorBio, instagram] = await Promise.all([
    getVendorMeta(supabase as any, vendorNameForMeta, null).catch(() => ({})),
    getArtistImageByHandle(handle).catch(() => undefined),
    getCollectionDescription(handle).catch(() => undefined),
    getVendorBioByHandle(handle).catch(() => null),
    getCollectionInstagram(handle).catch(() => undefined),
  ])

  const name =
    nameFromCollection ||
    vendorBio?.vendorName?.trim() ||
    vendorMeta?.vendorSlug?.trim() ||
    titleCaseFromHandle(handle)

  const bio =
    vendorBio?.bio?.trim() ||
    vendorMeta?.bio?.trim() ||
    collectionDesc?.trim() ||
    (collection?.description?.trim()
      ? collection.description.trim()
      : collection?.descriptionHtml
        ? collection.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : undefined) ||
    getBioFromShopifyPage(handle) ||
    undefined

  const instagramHandle = instagram || vendorMeta?.instagram
  const instagramUrl = instagramHandle ? `https://www.instagram.com/${instagramHandle}/` : undefined

  return {
    handle,
    name,
    location,
    collectionUrl,
    imageUrl: vendorMeta?.image || image,
    instagramUrl,
    bio,
  }
}

async function main() {
  const seeds = streetCollectorContent.featuredArtists.collections

  const resolved = await Promise.all(seeds.map((s) => resolveArtist(s)))

  const updatedAt = new Date().toISOString().slice(0, 10)

  const lines: string[] = []
  lines.push('# Street Collector — Featured artists (enriched export)')
  lines.push('')
  lines.push('Generated from the featured artist seed list and enriched via Shopify + Supabase lookups.')
  lines.push('')
  lines.push(`- **Source seed list**: \`content/street-collector.ts\``)
  lines.push(`- **Generated**: ${updatedAt}`)
  lines.push('')
  lines.push('## Index')
  lines.push('')
  for (const a of resolved) {
    lines.push(`- [${mdEscape(a.name)}](#${a.handle})`)
  }
  lines.push('')
  lines.push('## Artists')
  lines.push('')

  for (const a of resolved) {
    lines.push(`### ${a.name}`)
    lines.push(`<a id="${a.handle}"></a>`)
    lines.push('')
    lines.push(`- **Handle**: \`${a.handle}\``)
    if (a.location) lines.push(`- **Location**: ${mdEscape(a.location)}`)
    lines.push(`- **Collection**: \`${a.collectionUrl}\``)
    if (a.instagramUrl) lines.push(`- **Instagram**: \`${a.instagramUrl}\``)
    if (a.imageUrl) lines.push(`- **Image**: \`${a.imageUrl}\``)
    lines.push('')
    if (a.bio) {
      lines.push('**Bio / description**')
      lines.push('')
      lines.push(a.bio.trim())
      lines.push('')
    } else {
      lines.push('**Bio / description**')
      lines.push('')
      lines.push('_Not available from Shopify collection description or Supabase vendor bio._')
      lines.push('')
    }
    lines.push('---')
    lines.push('')
  }

  process.stdout.write(lines.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

