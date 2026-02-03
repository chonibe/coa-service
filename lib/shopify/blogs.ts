/**
 * Shopify Blog/Article Queries
 * 
 * Fetches blog posts and articles from the Shopify Storefront API.
 * Used for blog listing, article pages, and related content.
 */

import { storefrontQuery, type ShopifyImage } from './storefront-client'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ShopifyArticleAuthor {
  name: string
  email?: string
  bio?: string
}

export interface ShopifySeo {
  title: string | null
  description: string | null
}

export interface ShopifyArticle {
  id: string
  handle: string
  title: string
  content: string // Plain text
  contentHtml: string // HTML content
  excerpt: string | null
  excerptHtml: string | null
  image: ShopifyImage | null
  publishedAt: string
  author: ShopifyArticleAuthor
  tags: string[]
  blog: {
    handle: string
    title: string
  }
  seo: ShopifySeo
}

export interface ShopifyBlog {
  id: string
  handle: string
  title: string
  articles: {
    edges: Array<{ node: ShopifyArticle }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
  seo: ShopifySeo
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const ARTICLE_FRAGMENT = `
  fragment ArticleFields on Article {
    id
    handle
    title
    content
    contentHtml
    excerpt
    excerptHtml
    publishedAt
    tags
    image {
      url
      altText
      width
      height
    }
    author {
      name
    }
    blog {
      handle
      title
    }
    seo {
      title
      description
    }
  }
`

const GET_BLOGS_QUERY = `
  query GetBlogs($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          id
          handle
          title
          seo {
            title
            description
          }
        }
      }
    }
  }
`

const GET_BLOG_WITH_ARTICLES_QUERY = `
  ${ARTICLE_FRAGMENT}
  query GetBlogWithArticles($handle: String!, $first: Int!, $after: String) {
    blog(handle: $handle) {
      id
      handle
      title
      seo {
        title
        description
      }
      articles(first: $first, after: $after, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            ...ArticleFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

const GET_ARTICLE_QUERY = `
  ${ARTICLE_FRAGMENT}
  query GetArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        ...ArticleFields
      }
    }
  }
`

const GET_ALL_ARTICLES_QUERY = `
  ${ARTICLE_FRAGMENT}
  query GetAllArticles($first: Int!, $after: String) {
    articles(first: $first, after: $after, sortKey: PUBLISHED_AT, reverse: true) {
      edges {
        node {
          ...ArticleFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all blogs (without articles)
 */
export async function getBlogs(): Promise<Array<{ id: string; handle: string; title: string; seo: ShopifySeo }>> {
  try {
    const data = await storefrontQuery<{
      blogs: {
        edges: Array<{ node: { id: string; handle: string; title: string; seo: ShopifySeo } }>
      }
    }>(GET_BLOGS_QUERY, { first: 10 })
    
    return data.blogs.edges.map(edge => edge.node)
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return []
  }
}

/**
 * Get a blog with its articles
 */
export async function getBlogWithArticles(handle: string, options: {
  first?: number
  after?: string
} = {}): Promise<ShopifyBlog | null> {
  const { first = 20, after } = options
  
  try {
    const data = await storefrontQuery<{ blog: ShopifyBlog | null }>(
      GET_BLOG_WITH_ARTICLES_QUERY, 
      { handle, first, after }
    )
    return data.blog
  } catch (error) {
    console.error(`Error fetching blog "${handle}":`, error)
    return null
  }
}

/**
 * Get a single article by blog and article handles
 */
export async function getArticle(blogHandle: string, articleHandle: string): Promise<ShopifyArticle | null> {
  try {
    const data = await storefrontQuery<{ 
      blog: { articleByHandle: ShopifyArticle | null } | null 
    }>(GET_ARTICLE_QUERY, { blogHandle, articleHandle })
    
    return data.blog?.articleByHandle || null
  } catch (error) {
    console.error(`Error fetching article "${articleHandle}" from blog "${blogHandle}":`, error)
    return null
  }
}

/**
 * Get all articles across all blogs
 */
export async function getAllArticles(options: {
  first?: number
  after?: string
} = {}): Promise<{
  articles: ShopifyArticle[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}> {
  const { first = 20, after } = options
  
  try {
    const data = await storefrontQuery<{
      articles: {
        edges: Array<{ node: ShopifyArticle }>
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
      }
    }>(GET_ALL_ARTICLES_QUERY, { first, after })
    
    return {
      articles: data.articles.edges.map(edge => edge.node),
      pageInfo: data.articles.pageInfo,
    }
  } catch (error) {
    console.error('Error fetching all articles:', error)
    return {
      articles: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    }
  }
}

/**
 * Get all articles with auto-pagination
 */
export async function fetchAllArticles(): Promise<ShopifyArticle[]> {
  const allArticles: ShopifyArticle[] = []
  let hasNextPage = true
  let cursor: string | null = null
  
  while (hasNextPage) {
    const { articles, pageInfo } = await getAllArticles({ 
      first: 50, 
      after: cursor || undefined 
    })
    
    allArticles.push(...articles)
    hasNextPage = pageInfo.hasNextPage
    cursor = pageInfo.endCursor
  }
  
  return allArticles
}

// =============================================================================
// ARTICLE UTILITIES
// =============================================================================

/**
 * Get reading time estimate for an article
 */
export function getReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Format article date
 */
export function formatArticleDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get article excerpt (truncated)
 */
export function getArticleExcerpt(article: ShopifyArticle, maxLength: number = 160): string {
  if (article.excerpt) {
    return article.excerpt.length > maxLength 
      ? article.excerpt.slice(0, maxLength) + '...'
      : article.excerpt
  }
  
  const plainText = article.content.replace(/<[^>]*>/g, '').trim()
  return plainText.length > maxLength 
    ? plainText.slice(0, maxLength) + '...'
    : plainText
}

/**
 * Group articles by tag
 */
export function groupArticlesByTag(articles: ShopifyArticle[]): Record<string, ShopifyArticle[]> {
  const grouped: Record<string, ShopifyArticle[]> = {}
  
  for (const article of articles) {
    for (const tag of article.tags) {
      if (!grouped[tag]) {
        grouped[tag] = []
      }
      grouped[tag].push(article)
    }
  }
  
  return grouped
}

/**
 * Get related articles by tags
 */
export function getRelatedArticles(
  article: ShopifyArticle, 
  allArticles: ShopifyArticle[], 
  limit: number = 3
): ShopifyArticle[] {
  const articleTags = new Set(article.tags)
  
  // Score articles by matching tags
  const scored = allArticles
    .filter(a => a.id !== article.id)
    .map(a => ({
      article: a,
      score: a.tags.filter(tag => articleTags.has(tag)).length,
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
  
  return scored.slice(0, limit).map(item => item.article)
}

// =============================================================================
// CACHED BLOG FUNCTIONS
// =============================================================================

// In-memory cache
const blogCache: Map<string, { data: ShopifyBlog | null; timestamp: number }> = new Map()
const articleCache: Map<string, { data: ShopifyArticle | null; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get blog with caching
 */
export async function getCachedBlog(handle: string): Promise<ShopifyBlog | null> {
  const now = Date.now()
  const cached = blogCache.get(handle)
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  const blog = await getBlogWithArticles(handle)
  blogCache.set(handle, { data: blog, timestamp: now })
  return blog
}

/**
 * Get article with caching
 */
export async function getCachedArticle(blogHandle: string, articleHandle: string): Promise<ShopifyArticle | null> {
  const cacheKey = `${blogHandle}:${articleHandle}`
  const now = Date.now()
  const cached = articleCache.get(cacheKey)
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  const article = await getArticle(blogHandle, articleHandle)
  articleCache.set(cacheKey, { data: article, timestamp: now })
  return article
}

/**
 * Clear blog/article cache
 */
export function clearBlogCache(): void {
  blogCache.clear()
  articleCache.clear()
}
