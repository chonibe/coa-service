import {
  extractStyleTagsFromBio,
  extractStyleTagsFromProductTags,
  mergeArtistStyleTags,
} from './experience-artist-style-tags'

describe('extractStyleTagsFromBio', () => {
  it('finds style and location keywords', () => {
    const tags = extractStyleTagsFromBio(
      'Based in Tel Aviv, their figurative street art blends neon and collage.'
    )
    expect(tags).toEqual(expect.arrayContaining(['tel aviv', 'figurative', 'street art', 'neon', 'collage']))
  })

  it('returns empty for blank bio', () => {
    expect(extractStyleTagsFromBio('')).toEqual([])
  })
})

describe('mergeArtistStyleTags', () => {
  it('merges bio and product tags', () => {
    const tags = mergeArtistStyleTags('Montreal abstract painter', [
      { tags: ['Season 2', 'Limited Edition'] },
    ])
    expect(tags).toEqual(expect.arrayContaining(['montreal', 'abstract', 'limited edition']))
  })
})

describe('extractStyleTagsFromProductTags', () => {
  it('skips season noise', () => {
    expect(extractStyleTagsFromProductTags([{ tags: ['Season 1', 'Portrait'] }])).toEqual(['portrait'])
  })
})
