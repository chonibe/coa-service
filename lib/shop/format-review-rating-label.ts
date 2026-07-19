export type ReviewRatingSummary = {
  averageScore: number
  totalReviews: number
}

/**
 * Round to one decimal for display (e.g. 4.96 → "5.0", 4.84 → "4.8").
 * Never invents a softer score — only formats the real average.
 */
export function formatAverageScore(averageScore: number): string {
  if (!Number.isFinite(averageScore) || averageScore <= 0) return ''
  return (Math.round(averageScore * 10) / 10).toFixed(1)
}

export function formatReviewCount(totalReviews: number): string {
  if (!Number.isFinite(totalReviews) || totalReviews <= 0) return ''
  return new Intl.NumberFormat('en-US').format(Math.floor(totalReviews))
}

/**
 * Brand-matched trust badge copy: "5.0 from 15 reviews".
 * Returns null when count is missing so callers can fall back without inventing N.
 */
export function formatReviewRatingLabel(
  summary: ReviewRatingSummary | null | undefined
): string | null {
  if (!summary) return null
  const { averageScore, totalReviews } = summary
  if (!Number.isFinite(totalReviews) || totalReviews <= 0) return null
  if (!Number.isFinite(averageScore) || averageScore <= 0) return null
  const avg = formatAverageScore(averageScore)
  const count = formatReviewCount(totalReviews)
  const noun = totalReviews === 1 ? 'review' : 'reviews'
  return `${avg} from ${count} ${noun}`
}

/** Compact hero/stat line: "★ 5.0". */
export function formatReviewStarStat(
  summary: ReviewRatingSummary | null | undefined
): string | null {
  if (!summary) return null
  if (!Number.isFinite(summary.averageScore) || summary.averageScore <= 0) return null
  if (!Number.isFinite(summary.totalReviews) || summary.totalReviews <= 0) return null
  return `★ ${formatAverageScore(summary.averageScore)}`
}

/** Hero/stat caption under the star score: "15 reviews". */
export function formatReviewCountStatLabel(
  summary: ReviewRatingSummary | null | undefined
): string | null {
  if (!summary) return null
  if (!Number.isFinite(summary.totalReviews) || summary.totalReviews <= 0) return null
  const count = formatReviewCount(summary.totalReviews)
  const noun = summary.totalReviews === 1 ? 'review' : 'reviews'
  return `${count} ${noun}`
}
