import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { ArticleBodyRenderer } from '@/components/blog/ArticleBodyRenderer'
import { SanitizedHtml } from '@/components/SanitizedHtml'
import { ScrollProgress } from '@/components/blocks'
import {
  getEditorialArticle,
  getEditorialArticleHandles,
  getRelatedEditorialArticles,
  type EditorialArticle,
} from '@/content/editorial-blog'
import { getCachedArticle } from '@/lib/shopify/blogs'

interface PageParams {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  return getEditorialArticleHandles()
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { handle } = await params
  const article = await getArticleForHandle(handle)

  if (!article) {
    return {
      title: 'Article | Collector Journal | Street Collector',
      description: 'Read collector-first articles from Street Collector.',
    }
  }

  return {
    title: `${article.title} | Collector Journal | Street Collector`,
    description: article.excerpt,
    openGraph: article.heroImage
      ? {
          title: article.title,
          description: article.excerpt,
          images: [{ url: article.heroImage }],
        }
      : undefined,
  }
}

export default async function ArticlePage({ params }: PageParams) {
  const { handle } = await params
  const article = await getArticleForHandle(handle)

  if (!article) {
    notFound()
  }

  const relatedArticles = getRelatedEditorialArticles(article, 3)
  const headings = extractHeadings(article)

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#171515]">
      <ScrollProgress position="top" color="#8b3f25" height={3} />

      <article>
        <header className="border-b border-[#171515]/12 bg-white px-5 pt-20 sm:px-8 lg:px-12 lg:pt-24">
          <div className="mx-auto grid max-w-[1600px] gap-10 pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1fr)] lg:items-end lg:pb-14">
            <div>
              <Link
                href="/shop/blog"
                className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#171515]/55 transition hover:text-[#171515]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Journal
              </Link>
              <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8b3f25]">
                <span>{article.category}</span>
                <span className="h-px w-8 bg-[#8b3f25]/35" />
                <span>{formatArticleFormat(article.articleFormat)}</span>
                <span className="h-px w-8 bg-[#8b3f25]/35" />
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {article.readingTime} min read
                </span>
              </div>
              <h1 className="mt-6 max-w-5xl font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.02em] text-[#171515] sm:text-5xl lg:text-7xl">
                {article.title}
              </h1>
            </div>
            <div className="max-w-2xl lg:pb-2">
              <p className="text-lg leading-8 text-[#171515]/70 sm:text-xl">{article.excerpt}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#171515]/45">
                Reviewed {formatEditorialDate(article.lastReviewedAt)}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {article.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="border border-[#171515]/12 bg-[#f7f4ef] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#171515]/58">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {article.heroImage && (
            <div className="mx-auto max-w-[1600px]">
              <figure className="border-t border-[#171515]/12 pt-4">
                <div className="relative aspect-[16/9] max-h-[760px] overflow-hidden bg-[#171515]">
                  <img
                    src={article.heroImage}
                    alt={article.heroAlt || article.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {article.imageCredit && (
                  <figcaption className="py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#171515]/45">
                    {article.imageCredit}
                  </figcaption>
                )}
              </figure>
            </div>
          )}
        </header>

        <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[220px_minmax(0,760px)_minmax(220px,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 border-t border-[#171515]/12 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b3f25]">In this guide</p>
                <nav className="mt-4 flex flex-col gap-3">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className="text-sm leading-5 text-[#171515]/58 transition hover:text-[#171515]"
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0">
              {article.body ? (
                <ArticleBodyRenderer article={article} />
              ) : (
                <SanitizedHtml
                  html={normalizeLegacyArticleHtml(article.contentHtml)}
                  config={{
                    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'img', 'figure', 'figcaption'],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'id'],
                  }}
                  className="editorial-prose prose prose-lg max-w-none
                    prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-headings:text-[#171515]
                    prose-h2:mt-14 prose-h2:border-t prose-h2:border-[#171515]/12 prose-h2:pt-8 prose-h2:text-3xl
                    prose-p:text-[#171515]/75 prose-p:leading-8
                    prose-a:text-[#8b3f25] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-[#171515]
                    prose-ul:text-[#171515]/75 prose-li:my-2 prose-li:leading-7
                    prose-img:my-8
                    prose-blockquote:border-l-[#8b3f25] prose-blockquote:bg-white prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:font-heading prose-blockquote:text-2xl prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:text-[#171515]
                  "
                />
              )}

              {article.relatedArtistSlug && (
                <div className="mt-12 border border-[#171515]/12 bg-white p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b3f25]">Continue with the artist</p>
                  <p className="mt-3 text-sm leading-7 text-[#171515]/65">
                    Use the artist profile to compare works, materials, and availability after reading the editorial guide.
                  </p>
                  <Link
                    href={`/shop/artists/${article.relatedArtistSlug}`}
                    className="mt-5 inline-flex min-h-[44px] items-center gap-2 border border-[#171515] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#171515] transition hover:bg-[#171515] hover:text-white"
                  >
                    View artist profile
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              )}
            </div>
            <div className="hidden xl:block" aria-hidden />
          </div>
        </section>
      </article>

      {relatedArticles.length > 0 && (
        <section className="border-t border-[#171515]/12 bg-white px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1600px]">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b3f25]">Keep reading</p>
                <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.02em] text-[#171515]">Related collector guides</h2>
              </div>
              <Link href="/shop/blog" className="hidden min-h-[44px] items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#171515]/58 transition hover:text-[#171515] sm:inline-flex">
                All articles
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedArticles.map((related) => (
                <RelatedArticleCard key={related.handle} article={related} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

async function getArticleForHandle(handle: string): Promise<EditorialArticle | undefined> {
  const localArticle = getEditorialArticle(handle)
  if (localArticle) return localArticle

  for (const blogHandle of ['news', 'blog', 'journal', 'stories']) {
    const shopifyArticle = await getCachedArticle(blogHandle, handle)
    if (shopifyArticle) {
      const contentHtml = shopifyArticle.contentHtml
      return {
        handle,
        title: shopifyArticle.title,
        excerpt: shopifyArticle.seo?.description || shopifyArticle.excerpt || `Read ${shopifyArticle.title}.`,
        contentHtml,
        heroImage: shopifyArticle.image?.url || null,
        heroAlt: shopifyArticle.image?.altText || shopifyArticle.title,
        imageCredit: shopifyArticle.image?.url ? 'Shopify-synced blog image' : null,
        publishedAt: shopifyArticle.publishedAt,
        author: shopifyArticle.author.name,
        tags: shopifyArticle.tags,
        category: 'Guides',
        sourceKind: 'shopify-fallback',
        readingTime: Math.max(2, Math.ceil(contentHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 210)),
      }
    }
  }

  return undefined
}

function extractHeadings(article: EditorialArticle): Array<{ id: string; text: string }> {
  if (article.body) {
    return article.body.sections
      .filter((section) => section.title)
      .map((section) => ({
        id: section.id,
        text: section.title || '',
      }))
  }

  return Array.from(article.contentHtml.matchAll(/<h2\s+id="([^"]+)">([^<]+)<\/h2>/g)).map((match) => ({
    id: match[1],
    text: match[2],
  }))
}

function normalizeLegacyArticleHtml(html: string): string {
  return html
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<div class="w-full border-b[\s\S]*?<div class="request-[\s\S]*?style="text-align: left;">/i, '')
    .replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i, '')
}

function formatEditorialDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatArticleFormat(value: EditorialArticle['articleFormat']) {
  switch (value) {
    case 'profile':
      return 'Profile'
    case 'walkthrough':
      return 'Walkthrough'
    case 'checklist':
      return 'Checklist'
    case 'roundup':
      return 'Roundup'
    default:
      return 'Field Guide'
  }
}

function RelatedArticleCard({ article }: { article: EditorialArticle }) {
  return (
    <Link href={`/shop/blog/${article.handle}`} className="group block border-t border-[#171515]/12 pt-4">
      <div className="aspect-[4/3] overflow-hidden bg-[#171515]/10">
        {article.heroImage ? (
          <img
            src={article.heroImage}
            alt={article.heroAlt || article.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#171515] font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Editorial
          </div>
        )}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b3f25]">{article.category}</p>
      <h3 className="mt-2 font-heading text-xl font-semibold leading-tight tracking-[-0.02em] text-[#171515] transition group-hover:text-[#8b3f25]">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#171515]/60">{article.excerpt}</p>
    </Link>
  )
}
