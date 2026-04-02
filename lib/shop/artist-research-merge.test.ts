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

  it('concatenates when collection and research differ', () => {
    expect(
      mergeShopifyCollectionBioWithResearch('Exclusive prints on Street Collector.', 'Born in Lisbon in 1990.', undefined)
    ).toBe('Exclusive prints on Street Collector.\n\nBorn in Lisbon in 1990.')
  })

  it('strips HTML for dedup and returns single research block when equivalent', () => {
    const collection = '<p>Same text</p>'
    const story = 'Same text'
    expect(mergeShopifyCollectionBioWithResearch(collection, story, undefined)).toBe(story)
  })
})
