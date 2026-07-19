import {
  formatEditionHoldCompactLine,
  formatEditionHoldCompactLineParts,
} from './format-edition-hold-display'

describe('formatEditionHoldCompactLineParts', () => {
  it('returns edition label and timer suffix separately', () => {
    expect(formatEditionHoldCompactLineParts(4, '23h 41m')).toEqual({
      editionLabel: 'Edition #4',
      timerSuffix: ' · 23h 41m reserved',
    })
  })

  it('handles unknown edition number', () => {
    expect(formatEditionHoldCompactLineParts(null, '12m')).toEqual({
      editionLabel: 'Edition',
      timerSuffix: ' · 12m reserved',
    })
  })
})

describe('formatEditionHoldCompactLine', () => {
  it('joins parts into a single line', () => {
    expect(formatEditionHoldCompactLine(4, '23h 41m')).toBe('Edition #4 · 23h 41m reserved')
  })
})
