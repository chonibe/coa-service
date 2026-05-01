'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BlogIndexArticle {
  handle: string
  title: string
  excerpt: string
  articleFormat: string
  heroImage: string | null
  heroAlt: string | null
  imageCredit: string | null
  tags: string[]
  category: string
  readingTime: number
}

interface BlogMagazineClientProps {
  articles: BlogIndexArticle[]
  filters: string[]
}

export function BlogMagazineClient({ articles, filters }: BlogMagazineClientProps) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')

  const featuredArticle = articles[0]
  const remainingArticles = articles.slice(1)

  const filteredArticles = useMemo(() => {
    const search = query.trim().toLowerCase()

    return remainingArticles.filter((article) => {
      const matchesFilter =
        activeFilter === 'All' ||
        article.category === activeFilter ||
        article.tags.some((tag) => tag.toLowerCase() === activeFilter.toLowerCase())

      const matchesSearch =
        !search ||
        `${article.title} ${article.excerpt} ${article.tags.join(' ')}`.toLowerCase().includes(search)

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, query, remainingArticles])

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#171515]">
      <section className="border-b border-[#171515]/10 bg-[#f7f4ef] px-5 pb-10 pt-20 sm:px-8 lg:px-12 lg:pt-24">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.65fr)] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8b3f25]">Collector journal</p>
            <h1 className="mt-5 max-w-5xl font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.02em] text-[#171515] sm:text-6xl lg:text-7xl">
              Art guides for people who want to collect with better eyes.
            </h1>
          </div>
          <p className="max-w-xl text-base leading-8 text-[#171515]/65 sm:text-lg">
            Field notes, city guides, and buying guides for collectors who care about street art, graphic work, and the scenes around them.
          </p>
        </div>
      </section>

      {featuredArticle && (
        <section className="bg-white px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="mx-auto grid max-w-[1600px] border-y border-[#171515]/12 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <Link href={`/shop/blog/${featuredArticle.handle}`} className="group relative block min-h-[360px] overflow-hidden bg-[#171515] lg:min-h-[560px]">
              {featuredArticle.heroImage ? (
                <img
                  src={featuredArticle.heroImage}
                  alt={featuredArticle.heroAlt || featuredArticle.title}
                  className="h-full min-h-[360px] w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.025] group-hover:opacity-100 lg:min-h-[560px]"
                />
              ) : (
                <div className="h-full min-h-[360px] bg-[#241f1d] lg:min-h-[560px]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
              {featuredArticle.imageCredit && (
                <p className="absolute bottom-4 left-4 max-w-[80%] font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                  {featuredArticle.imageCredit}
                </p>
              )}
            </Link>
            <article className="flex flex-col justify-between gap-10 border-t border-[#171515]/12 bg-[#f7f4ef] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-12">
              <div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8b3f25]">
                  <span>{featuredArticle.category}</span>
                  <span className="h-px w-8 bg-[#8b3f25]/35" />
                  <span>{formatArticleFormat(featuredArticle.articleFormat)}</span>
                  <span className="h-px w-8 bg-[#8b3f25]/35" />
                  <span>{featuredArticle.readingTime} min read</span>
                </div>
                <h2 className="mt-7 font-heading text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-[#171515] sm:text-5xl">
                  {featuredArticle.title}
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#171515]/70">{featuredArticle.excerpt}</p>
              </div>
              <Link
                href={`/shop/blog/${featuredArticle.handle}`}
                className="inline-flex min-h-[48px] w-fit items-center gap-3 border border-[#171515] bg-[#171515] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#2a2523]"
              >
                Read the {formatArticleFormat(featuredArticle.articleFormat).toLowerCase()}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          </div>
        </section>
      )}

      <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col gap-5 border-b border-[#171515]/12 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8b3f25]">Browse the issue</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.02em] text-[#171515]">Guides, profiles, and collector notes</h2>
            </div>
            <label className="relative block w-full max-w-md">
              <span className="sr-only">Search articles</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#171515]/45" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search artists, places, ideas"
                className="min-h-[48px] w-full border border-[#171515]/15 bg-white py-3 pl-11 pr-4 text-sm text-[#171515] outline-none transition placeholder:text-[#171515]/40 focus:border-[#171515]"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#171515]/45" aria-hidden />
            {['All', ...filters].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'min-h-[40px] shrink-0 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition',
                  activeFilter === filter
                    ? 'border-[#171515] bg-[#171515] text-white'
                    : 'border-[#171515]/12 bg-white text-[#171515]/65 hover:border-[#171515]/45 hover:text-[#171515]'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="mt-12 border border-[#171515]/12 bg-white p-10 text-center">
              <p className="font-heading text-2xl font-semibold text-[#171515]">No articles match that view.</p>
              <p className="mt-3 text-[#171515]/60">Clear the search or choose another editorial section.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.handle} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function ArticleCard({ article }: { article: BlogIndexArticle }) {
  return (
    <article className="group border-t border-[#171515]/12 pt-4">
      <Link href={`/shop/blog/${article.handle}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#171515]/10">
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
        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b3f25]">
          <span>{article.category}</span>
          <span className="text-[#171515]/25">/</span>
          <span>{formatArticleFormat(article.articleFormat)}</span>
          <span className="text-[#171515]/25">/</span>
          <span className="inline-flex items-center gap-1 text-[#171515]/45">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {article.readingTime} min
          </span>
        </div>
        <h3 className="mt-3 font-heading text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#171515] transition group-hover:text-[#8b3f25]">
          {article.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#171515]/62">{article.excerpt}</p>
      </Link>
    </article>
  )
}

function formatArticleFormat(value: string) {
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
