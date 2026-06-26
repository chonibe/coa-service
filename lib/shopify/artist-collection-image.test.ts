import {
  focalPointToObjectPosition,
  artistPortraitCoverStyle,
  DEFAULT_ARTIST_PORTRAIT_OBJECT_POSITION,
} from '@/lib/shopify/artist-collection-image'

describe('focalPointToObjectPosition', () => {
  it('converts normalized focal point to CSS percentages', () => {
    expect(focalPointToObjectPosition(0.5, 0.35)).toBe('50% 35%')
    expect(focalPointToObjectPosition(0, 1)).toBe('0% 100%')
  })

  it('clamps out-of-range values', () => {
    expect(focalPointToObjectPosition(-0.2, 1.5)).toBe('0% 100%')
  })
})

describe('artistPortraitCoverStyle', () => {
  it('defaults to center center', () => {
    expect(artistPortraitCoverStyle()).toEqual({
      objectFit: 'cover',
      objectPosition: DEFAULT_ARTIST_PORTRAIT_OBJECT_POSITION,
    })
  })

  it('uses provided object position', () => {
    expect(artistPortraitCoverStyle('40% 20%')).toEqual({
      objectFit: 'cover',
      objectPosition: '40% 20%',
    })
  })
})
