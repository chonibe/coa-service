import {
  lookupArtistResearch,
  mergeResearchBio,
  mergeResearchIntoProfile,
  mergeShopifyCollectionBioWithResearch,
} from './artist-research-merge'

describe('mergeShopifyCollectionBioWithResearch', () => {
  it('returns only research when collection is empty', () => {
    expect(mergeShopifyCollectionBioWithResearch(undefined, 'Story body.', undefined)).toBe('Story body.')
  })

  it('ignores additional history when story is present', () => {
    expect(mergeShopifyCollectionBioWithResearch(undefined, 'A.', 'B.')).toBe('A.')
  })

  it('returns only collection when research is empty', () => {
    expect(mergeShopifyCollectionBioWithResearch('Shop line.', undefined, undefined)).toBe('Shop line.')
  })

  it('returns research when collection text is contained in research', () => {
    const collection = 'Short lede.'
    const story = 'Short lede.\n\nMore paragraphs here.'
    expect(mergeShopifyCollectionBioWithResearch(collection, story, undefined)).toBe(story)
  })

  it('puts curated research before collection when both differ', () => {
    expect(
      mergeShopifyCollectionBioWithResearch('Exclusive prints on Street Collector.', 'Born in Lisbon in 1990.', undefined)
    ).toBe('Born in Lisbon in 1990.\n\nExclusive prints on Street Collector.')
  })

  it('strips HTML for dedup and returns single research block when equivalent', () => {
    const collection = '<p>Same text</p>'
    const story = 'Same text'
    expect(mergeShopifyCollectionBioWithResearch(collection, story, undefined)).toBe(story)
  })

  it('repairs mojibake in the visible bio', () => {
    const story = 'JÃ©rÃ´me Masi paints quiet, cinematic scenes that leave room for the viewer.'
    expect(mergeShopifyCollectionBioWithResearch(undefined, story, undefined)).toBe(
      'Jérôme Masi paints quiet, cinematic scenes that leave room for the viewer.'
    )
  })
})

describe('mergeResearchIntoProfile', () => {
  it('strips instagram handles from storefront story hooks', () => {
    const profile = mergeResearchIntoProfile({}, 'alin-mor')
    expect(profile.storyHook).toBe(
      'Alin Mor graduated Bezalel in visual communications and built a practice around femininity, archetype, and spiritual symbolism at mural scale.'
    )
  })

  it('drops note-style activeSince metadata', () => {
    const profile = mergeResearchIntoProfile({}, 'alin-mor')
    expect(profile.activeSince).toBeUndefined()
  })

  it('supports research aliases for artists whose storefront slug differs', () => {
    const research = lookupArtistResearch('zivink')
    expect(research?.artistName).toBe('Erezoo')

    const profile = mergeResearchIntoProfile({}, 'zivink')
    expect(profile.storyHook).toContain('Erez Sameach works as Erezoo from Haifa')
    expect(mergeResearchBio('zivink', undefined)).toContain('Born in Carmiel')
  })

  it('drops system-like research notes for tyler-shelton', () => {
    const profile = mergeResearchIntoProfile({}, 'tyler-shelton')
    expect(profile.impactCallout).toBeUndefined()
    expect(profile.exclusiveCallout).toBeUndefined()
    expect(profile.location).toBe('Texas, USA')
    expect(profile.storyHook).not.toMatch(/sheltonartco/i)
    expect(profile.processGallery?.[0]?.label).toBeUndefined()
    expect(profile.press?.some((c) => /see source article/i.test(c.quote))).toBe(false)
    expect(profile.exhibitions?.[0]?.title).toBe('Tyler Shelton collection')
    expect(profile.exhibitions?.[0]?.city).toBe('Austin, Texas')
  })
})
