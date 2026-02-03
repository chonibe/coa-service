import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getArticle as getArticleFromApi, getCachedArticle } from '@/lib/shopify/blogs'
import { getArticle as getSyncedArticle, articles as syncedArticles } from '@/content/shopify-content'
import { Container, SectionWrapper, Button } from '@/components/impact'
import { ScrollReveal, ScrollProgress, ParallaxLayer } from '@/components/blocks'
import { VinylTiltEffect } from '@/components/vinyl'

// =============================================================================
// METADATA
// =============================================================================

interface PageParams {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { handle } = await params
  
  // Try synced content first
  const syncedArticle = getSyncedArticle(handle)
  if (syncedArticle) {
    return {
      title: `${syncedArticle.title} | Blog | Street Collector`,
      description: syncedArticle.excerpt || `Read ${syncedArticle.title} on the Street Collector blog`,
      openGraph: syncedArticle.imageUrl ? {
        images: [{ url: syncedArticle.imageUrl }],
      } : undefined,
    }
  }
  
  // Fall back to API - we need to find the blog handle
  // Default to 'news' blog, common Shopify default
  const article = await getCachedArticle('news', handle)
  if (article) {
    return {
      title: `${article.seo?.title || article.title} | Blog | Street Collector`,
      description: article.seo?.description || article.excerpt || `Read ${article.title} on the Street Collector blog`,
      openGraph: article.image ? {
        images: [{ url: article.image.url }],
      } : undefined,
    }
  }
  
  return {
    title: 'Article | Blog | Street Collector',
    description: 'Read articles on the Street Collector blog',
  }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function ArticlePage({ params }: PageParams) {
  const { handle } = await params
  
  // Try synced content first
  const syncedArticle = getSyncedArticle(handle)
  if (syncedArticle) {
    // Find related articles (same tags)
    const relatedArticles = syncedArticles
      .filter(a => 
        a.handle !== handle && 
        a.tags.some(tag => syncedArticle.tags.includes(tag))
      )
      .slice(0, 3)
    
    return (
      <ArticleContent
        title={syncedArticle.title}
        contentHtml={syncedArticle.contentHtml}
        imageUrl={syncedArticle.imageUrl}
        imageAlt={syncedArticle.imageAlt}
        publishedAt={syncedArticle.publishedAt}
        authorName={syncedArticle.authorName}
        tags={syncedArticle.tags}
        relatedArticles={relatedArticles.map(a => ({
          handle: a.handle,
          title: a.title,
          excerpt: a.excerpt,
          imageUrl: a.imageUrl,
        }))}
      />
    )
  }
  
  // Fall back to API - try common blog handles
  const blogHandles = ['news', 'blog', 'journal', 'stories']
  let article = null
  
  for (const blogHandle of blogHandles) {
    article = await getCachedArticle(blogHandle, handle)
    if (article) break
  }
  
  if (!article) {
    notFound()
  }
  
  return (
    <ArticleContent
      title={article.title}
      contentHtml={article.contentHtml}
      imageUrl={article.image?.url || null}
      imageAlt={article.image?.altText || null}
      publishedAt={article.publishedAt}
      authorName={article.author.name}
      tags={article.tags}
      relatedArticles={[]}
    />
  )
}

// =============================================================================
// ARTICLE CONTENT COMPONENT
// =============================================================================

interface ArticleContentProps {
  title: string
  contentHtml: string
  imageUrl: string | null
  imageAlt: string | null
  publishedAt: string
  authorName: string
  tags: string[]
  relatedArticles: Array<{
    handle: string
    title: string
    excerpt: string | null
    imageUrl: string | null
  }>
}

function ArticleContent({
  title,
  contentHtml,
  imageUrl,
  imageAlt,
  publishedAt,
  authorName,
  tags,
  relatedArticles,
}: ArticleContentProps) {
  // Format date
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  // Calculate reading time
  const wordCount = contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)
  
  return (
    <main className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <ScrollProgress position="top" color="#f0c417" height={3} />
      
      {/* Hero Image with Parallax */}
      {imageUrl && (
        <div className="w-full bg-[#f5f5f5] overflow-hidden">
          <div className="max-w-[1400px] mx-auto">
            <ParallaxLayer speed={0.5}>
              <div className="relative aspect-[21/9] sm:aspect-[16/7] overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={imageAlt || title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </ParallaxLayer>
          </div>
        </div>
      )}
      
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow">
          <ScrollReveal animation="fadeUp" duration={0.6}>
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/shop/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-xs font-medium text-[#2c4bce] uppercase tracking-wider hover:underline"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Title */}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-6">
              {title}
            </h1>
            
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-[#1a1a1a]/60 mb-8 pb-8 border-b border-[#1a1a1a]/10">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>{readingTime} min read</span>
              {authorName && (
                <>
                  <span>·</span>
                  <span>By {authorName}</span>
                </>
              )}
            </div>
          </ScrollReveal>
          
          {/* Content */}
          <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
            <article 
              className="prose prose-lg max-w-none
                prose-headings:font-heading prose-headings:font-semibold prose-headings:text-[#1a1a1a]
                prose-p:text-[#1a1a1a]/80 prose-p:leading-relaxed
                prose-a:text-[#2c4bce] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[#1a1a1a]
                prose-ul:text-[#1a1a1a]/80 prose-ol:text-[#1a1a1a]/80
                prose-img:rounded-xl
                prose-blockquote:border-l-[#2c4bce] prose-blockquote:bg-[#f5f5f5] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              "
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </ScrollReveal>
          
          {/* Share & Back */}
          <div className="mt-12 pt-8 border-t border-[#1a1a1a]/10 flex items-center justify-between">
            <Link href="/shop/blog">
              <Button variant="outline">
                ← Back to Blog
              </Button>
            </Link>
          </div>
        </Container>
      </SectionWrapper>
      
      {/* Related Articles with Tilt Effect */}
      {relatedArticles.length > 0 && (
        <SectionWrapper spacing="md" background="muted">
          <Container maxWidth="default">
            <ScrollReveal animation="fadeUp">
              <h2 className="font-heading text-2xl font-semibold text-[#1a1a1a] mb-8">
                Related Articles
              </h2>
            </ScrollReveal>
            <ScrollReveal animation="stagger" staggerAmount={0.1}>
              <div className="grid gap-8 md:grid-cols-3">
                {relatedArticles.map((article) => (
                  <VinylTiltEffect key={article.handle} maxTilt={8} scale={1.01}>
                    <Link
                      href={`/shop/blog/${article.handle}`}
                      className="group block"
                    >
                      <div className="aspect-[16/9] relative rounded-[24px] overflow-hidden bg-[#f5f5f5] mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        {article.imageUrl ? (
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-[#1a1a1a] group-hover:text-[#2c4bce] transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-2 text-sm text-[#1a1a1a]/60 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </Link>
                  </VinylTiltEffect>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </SectionWrapper>
      )}
    </main>
  )
}
