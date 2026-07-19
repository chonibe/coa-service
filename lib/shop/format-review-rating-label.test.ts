import {
  formatAverageScore,
  formatReviewCount,
  formatReviewCountStatLabel,
  formatReviewRatingLabel,
  formatReviewStarStat,
} from './format-review-rating-label'

describe('formatAverageScore', () => {
  it('formats to one decimal without softening', () => {
    expect(formatAverageScore(5)).toBe('5.0')
    expect(formatAverageScore(4.84)).toBe('4.8')
    expect(formatAverageScore(4.96)).toBe('5.0')
  })

  it('returns empty for invalid scores', () => {
    expect(formatAverageScore(0)).toBe('')
    expect(formatAverageScore(NaN)).toBe('')
  })
})

describe('formatReviewCount', () => {
  it('formats with thousands separators', () => {
    expect(formatReviewCount(15)).toBe('15')
    expect(formatReviewCount(340)).toBe('340')
    expect(formatReviewCount(1500)).toBe('1,500')
  })
})

describe('formatReviewRatingLabel', () => {
  it('returns truthful average + count copy', () => {
    expect(formatReviewRatingLabel({ averageScore: 5, totalReviews: 15 })).toBe(
      '5.0 from 15 reviews'
    )
    expect(formatReviewRatingLabel({ averageScore: 4.8, totalReviews: 340 })).toBe(
      '4.8 from 340 reviews'
    )
    expect(formatReviewRatingLabel({ averageScore: 5, totalReviews: 1 })).toBe(
      '5.0 from 1 review'
    )
  })

  it('returns null when count or score is missing', () => {
    expect(formatReviewRatingLabel(null)).toBeNull()
    expect(formatReviewRatingLabel({ averageScore: 5, totalReviews: 0 })).toBeNull()
    expect(formatReviewRatingLabel({ averageScore: 0, totalReviews: 10 })).toBeNull()
  })
})

describe('formatReviewStarStat / formatReviewCountStatLabel', () => {
  it('splits score and count for hero stats', () => {
    const summary = { averageScore: 5, totalReviews: 15 }
    expect(formatReviewStarStat(summary)).toBe('★ 5.0')
    expect(formatReviewCountStatLabel(summary)).toBe('15 reviews')
  })
})
