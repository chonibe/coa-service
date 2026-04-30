import type { MetadataRoute } from 'next'
import { absoluteShopUrl, getCanonicalSiteUrl } from '@/lib/seo/site-url'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const host = getCanonicalSiteUrl()
  const sitemap = absoluteShopUrl('/sitemap.xml')

  const allowAll: MetadataRoute.Robots['rules'] = [
    { userAgent: '*', allow: '/', disallow: ['/api/'] },
    { userAgent: 'Googlebot', allow: '/', disallow: ['/api/'] },
    { userAgent: 'Bingbot', allow: '/', disallow: ['/api/'] },
    { userAgent: 'Applebot', allow: '/', disallow: ['/api/'] },
    { userAgent: 'OAI-SearchBot', allow: '/' },
    { userAgent: 'GPTBot', allow: '/' },
    { userAgent: 'ChatGPT-User', allow: '/' },
    { userAgent: 'ClaudeBot', allow: '/' },
    { userAgent: 'Claude-SearchBot', allow: '/' },
    { userAgent: 'Claude-User', allow: '/' },
    { userAgent: 'anthropic-ai', allow: '/' },
    { userAgent: 'PerplexityBot', allow: '/' },
    { userAgent: 'Perplexity-User', allow: '/' },
    { userAgent: 'Google-Extended', allow: '/' },
    { userAgent: 'CCBot', allow: '/' },
  ]

  return {
    host,
    sitemap,
    rules: allowAll,
  }
}
