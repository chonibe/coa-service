import type { MetadataRoute } from 'next'
import { absoluteShopUrl, getCanonicalSiteUrl } from '@/lib/seo/site-url'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const host = getCanonicalSiteUrl()
  const sitemap = absoluteShopUrl('/sitemap.xml')

  const allowAll: MetadataRoute.Robots['rules'] = [
    { userAgent: '*', allow: '/', disallow: ['/api/'] },
    { userAgent: 'GPTBot', allow: '/' },
    { userAgent: 'ChatGPT-User', allow: '/' },
    { userAgent: 'ClaudeBot', allow: '/' },
    { userAgent: 'anthropic-ai', allow: '/' },
    { userAgent: 'PerplexityBot', allow: '/' },
    { userAgent: 'Google-Extended', allow: '/' },
  ]

  return {
    host,
    sitemap,
    rules: allowAll,
  }
}
