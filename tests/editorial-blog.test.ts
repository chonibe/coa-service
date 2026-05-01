import {
  getAllEditorialArticles,
  getEditorialArticle,
  getEditorialFilters,
} from '@/content/editorial-blog'

describe('editorial blog', () => {
  it('keeps key rewritten handles available', () => {
    expect(getEditorialArticle('israeli-street-artists-a-look-at-some-of-the-countrys-talents')).toBeDefined()
    expect(getEditorialArticle('discover-the-best-tel-aviv-gifts-and-home-decor-from-modern-jewish-artists')).toBeDefined()
    expect(getEditorialArticle('exploring-the-vibrant-art-scene-in-tel-aviv')).toBeDefined()
    expect(getEditorialArticle('how-to-collect-street-art-prints-without-buying-blind')).toBeDefined()
  })

  it('renders structured content for local flagship articles', () => {
    const flagship = getEditorialArticle('how-to-collect-street-art-prints-without-buying-blind')

    expect(flagship?.body?.sections.length).toBeGreaterThan(0)
    expect(flagship?.citations.length).toBeGreaterThan(0)
    expect(flagship?.contentHtml).toContain('<h2 id="the-first-mistake">')
    expect(flagship?.category).toBe('Street-to-Studio Collecting')
  })

  it('exposes the new editorial lanes as filters', () => {
    const filters = getEditorialFilters()

    expect(filters).toContain('City Field Guides')
    expect(filters).toContain('Street-to-Studio Collecting')
    expect(filters).toContain('Artists to Watch')
  })

  it('keeps the full inventory available after local overrides', () => {
    const articles = getAllEditorialArticles()

    expect(articles.length).toBeGreaterThan(70)
    expect(new Set(articles.map((article) => article.handle)).size).toBe(articles.length)
  })

  it('does not reuse media across the handcrafted editorial articles', () => {
    const articles = getAllEditorialArticles().filter((article) =>
      ['local-guide', 'benchmark-flagship'].includes(article.sourceKind)
    )

    const mediaToHandle = new Map<string, string>()

    for (const article of articles) {
      const media = new Set<string>()

      if (article.heroImage) {
        media.add(article.heroImage)
      }

      for (const section of article.body?.sections || []) {
        for (const block of section.blocks) {
          if (block.type === 'image') {
            media.add(block.image.src)
          }
          if (block.type === 'video') {
            media.add(block.video.url)
          }
        }
      }

      expect(media.size).toBe(
        (article.heroImage ? 1 : 0) +
          (article.body?.sections || []).flatMap((section) =>
            section.blocks.filter((block) => block.type === 'image' || block.type === 'video')
          ).length
      )

      for (const item of media) {
        expect(mediaToHandle.get(item)).toBeUndefined()
        mediaToHandle.set(item, article.handle)
      }
    }
  })
})
