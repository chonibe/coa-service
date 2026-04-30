import { cleanPublicArtistBio } from './public-artist-copy'
import { mergeShopifyCollectionBioWithResearch } from './artist-research-merge'

describe('mergeShopifyCollectionBioWithResearch', () => {
  it('returns only research when collection is empty', () => {
    expect(mergeShopifyCollectionBioWithResearch(undefined, 'Story body.', undefined)).toBe('Story body.')
  })

  it('returns story plus history when collection is empty', () => {
    expect(mergeShopifyCollectionBioWithResearch(undefined, 'A.', 'B.')).toBe('A.\n\nB.')
  })

  it('returns only collection when research is empty', () => {
    expect(mergeShopifyCollectionBioWithResearch('Shop line.', undefined, undefined)).toBe('Shop line.')
  })

  it('returns research when collection text is contained in research', () => {
    const collection = 'Short lede.'
    const story = 'Short lede.\n\nMore paragraphs here.'
    expect(mergeShopifyCollectionBioWithResearch(collection, story, undefined)).toBe(story)
  })

  it('puts curated research before collection when both differ (shop UI reads bio from the start)', () => {
    expect(
      mergeShopifyCollectionBioWithResearch('Exclusive prints on Street Collector.', 'Born in Lisbon in 1990.', undefined)
    ).toBe('Born in Lisbon in 1990.\n\nExclusive prints on Street Collector.')
  })

  it('strips HTML for dedup and returns single research block when equivalent', () => {
    const collection = '<p>Same text</p>'
    const story = 'Same text'
    expect(mergeShopifyCollectionBioWithResearch(collection, story, undefined)).toBe(story)
  })

  it('drops internal research notes from public bio output', () => {
    expect(
      mergeShopifyCollectionBioWithResearch(
        undefined,
        'Alice Bureau is a Zurich-based illustrator and art director.',
        'Auto-extracted from primary source page (verify before publishing): Behance Sign In Explore Jobs Resources Hire.'
      )
    ).toBe('Alice Bureau is a Zurich-based illustrator and art director.')
  })

  it('cleans scrape residue even when it comes from vendor copy', () => {
    expect(
      cleanPublicArtistBio(
        'Auto-extracted from primary source page (verify before publishing): Alice Hoffmann - Illustrator :: Behance Sign In Explore Jobs Resources Hire'
      )
    ).toBeUndefined()
  })

  it('drops batch audit notes from otherwise clean research history', () => {
    expect(
      mergeShopifyCollectionBioWithResearch(
        undefined,
        'Alice Hoffmann spent two decades in agency creative leadership before Bureau Alice became her primary output.',
        'Batch 3 (2026-04-03): No dated solo/group gallery shows found in indexed search; map to Exhibitions only when year/venue confirmed.'
      )
    ).toBe('Alice Hoffmann spent two decades in agency creative leadership before Bureau Alice became her primary output.')
  })
})
