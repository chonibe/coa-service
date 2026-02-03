'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Container, SectionWrapper, Button } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { VinylTiltEffect } from '@/components/vinyl'
import { articles as syncedArticles, type SyncedArticle } from '@/content/shopify-content'

// =============================================================================
// BLOG LISTING PAGE
// =============================================================================

export default function BlogPage() {
  const [articles, setArticles] = useState<SyncedArticle[]>(syncedArticles)
  const [loading, setLoading] = useState(syncedArticles.length === 0)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  
  // Fetch articles from API if synced content is empty
  useEffect(() => {
    if (syncedArticles.length === 0) {
      fetchArticles()
    }
  }, [])
  
  async function fetchArticles() {
    try {
      const response = await fetch('/api/shop/blog')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Get all unique tags
  const allTags = Array.from(new Set(articles.flatMap(a => a.tags)))
  
  // Filter articles by selected tag
  const filteredArticles = selectedTag 
    ? articles.filter(a => a.tags.includes(selectedTag))
    : articles
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md" background="default">
          <Container maxWidth="default">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-[#f5f5f5] rounded w-1/3" />
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-[16/9] bg-[#f5f5f5] rounded-xl" />
                    <div className="h-6 bg-[#f5f5f5] rounded w-3/4" />
                    <div className="h-4 bg-[#f5f5f5] rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }
  
  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="default">
          {/* Header with Scroll Animation */}
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <div className="text-center mb-12">
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                Blog
              </h1>
              <p className="text-[#1a1a1a]/60 text-lg max-w-2xl mx-auto">
                Stories, insights, and inspiration from the world of street art and contemporary design.
              </p>
            </div>
          </ScrollReveal>
          
          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-12">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${!selectedTag 
                    ? 'bg-[#1a1a1a] text-white' 
                    : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]'
                  }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${selectedTag === tag 
                      ? 'bg-[#1a1a1a] text-white' 
                      : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          
          {/* Articles Grid */}
          {filteredArticles.length === 0 ? (
            <NoArticlesFound />
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.handle} article={article} formatDate={formatDate} />
              ))}
            </div>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}

// =============================================================================
// ARTICLE CARD COMPONENT
// =============================================================================

function ArticleCard({ 
  article, 
  formatDate 
}: { 
  article: SyncedArticle
  formatDate: (date: string) => string 
}) {
  return (
    <VinylTiltEffect maxTilt={8} scale={1.01} perspective={800}>
      <Link 
        href={`/shop/blog/${article.handle}`}
        className="group block"
      >
        {/* Image */}
        <div className="aspect-[16/9] relative rounded-[24px] overflow-hidden bg-[#f5f5f5] mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
      
      {/* Content */}
      <div className="space-y-2">
        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {article.tags.slice(0, 2).map(tag => (
              <span 
                key={tag}
                className="text-xs font-medium text-[#2c4bce] uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Title */}
        <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] group-hover:text-[#2c4bce] transition-colors">
          {article.title}
        </h2>
        
        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-[#1a1a1a]/60 text-sm line-clamp-2">
            {article.excerpt}
          </p>
        )}
        
        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/50">
          <span>{formatDate(article.publishedAt)}</span>
          {article.authorName && (
            <>
              <span>·</span>
              <span>By {article.authorName}</span>
            </>
          )}
        </div>
      </div>
      </Link>
    </VinylTiltEffect>
  )
}
