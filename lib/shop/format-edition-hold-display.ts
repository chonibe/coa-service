import { formatCartEditionHoldEditionLabel } from '@/lib/shop/compute-cart-edition-reserve'

export type EditionHoldCompactLineParts = {
  editionLabel: string
  /** Includes leading middle dot, remaining time, and trailing " reserved". */
  timerSuffix: string
}

export function formatEditionHoldCompactLineParts(
  displayNumber: number | null,
  remaining: string
): EditionHoldCompactLineParts {
  const editionLabel = formatCartEditionHoldEditionLabel(displayNumber)
  return {
    editionLabel,
    timerSuffix: ` · ${remaining} reserved`,
  }
}

export function formatEditionHoldCompactLine(
  displayNumber: number | null,
  remaining: string
): string {
  const { editionLabel, timerSuffix } = formatEditionHoldCompactLineParts(displayNumber, remaining)
  return `${editionLabel}${timerSuffix}`
}
