import { aggregateYotpoProductBottomlinesForTest } from './yotpo-store-reviews'

describe('aggregateYotpoProductBottomlinesForTest', () => {
  it('computes weighted average and total from product bottomlines', () => {
    expect(
      aggregateYotpoProductBottomlinesForTest([
        { domain_key: 'a', product_score: 5.0, total_reviews: 14 },
        { domain_key: 'b', product_score: 5.0, total_reviews: 1 },
      ])
    ).toEqual({ averageScore: 5, totalReviews: 15 })
  })

  it('ignores empty rows and returns null when no reviews', () => {
    expect(aggregateYotpoProductBottomlinesForTest([])).toBeNull()
    expect(
      aggregateYotpoProductBottomlinesForTest([{ domain_key: 'a', product_score: 5, total_reviews: 0 }])
    ).toBeNull()
  })
})
