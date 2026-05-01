import { getAllEditorialArticles, getEditorialFilters } from '@/content/editorial-blog'
import { BlogMagazineClient, type BlogIndexArticle } from './BlogMagazineClient'

export const metadata = {
  title: 'Collector Journal | Street Collector',
  description: 'Collector-first guides, artist profiles, and field notes on street art, Tel Aviv, and contemporary art for the home.',
}

export default function BlogPage() {
  const articles: BlogIndexArticle[] = getAllEditorialArticles().map((article) => ({
    handle: article.handle,
    title: article.title,
    excerpt: article.excerpt,
    articleFormat: article.articleFormat,
    heroImage: article.heroImage,
    heroAlt: article.heroAlt,
    imageCredit: article.imageCredit,
    tags: article.tags,
    category: article.category,
    readingTime: article.readingTime,
  }))
  const filters = getEditorialFilters()

  return <BlogMagazineClient articles={articles} filters={filters} />
}
