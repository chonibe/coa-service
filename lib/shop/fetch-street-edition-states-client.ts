import {
  EDITION_STATES_MAX_IDS_PER_REQUEST,
  type StreetEditionStatesRow,
} from '@/lib/shop/street-edition-states'

type EditionStatesResponseItem = { productId: string } & StreetEditionStatesRow

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Loads street edition / ladder rows for all given product ids (numeric strings),
 * batching to stay within the API limit.
 */
export async function fetchStreetEditionStatesMap(
  productIds: string[]
): Promise<Record<string, StreetEditionStatesRow>> {
  const unique = Array.from(new Set(productIds.filter(Boolean)))
  const batches = chunk(unique, EDITION_STATES_MAX_IDS_PER_REQUEST)
  const map: Record<string, StreetEditionStatesRow> = {}

  const results = await Promise.all(
    batches.map((batch) =>
      fetch(`/api/shop/edition-states?ids=${encodeURIComponent(batch.join(','))}`).then((r) =>
        r.ok ? (r.json() as Promise<{ items?: EditionStatesResponseItem[] }>) : null
      )
    )
  )

  for (const j of results) {
    if (!j?.items) continue
    for (const item of j.items) {
      map[item.productId] = {
        label: item.label,
        priceUsd: item.priceUsd,
        subcopy: item.subcopy,
        nextBump: item.nextBump ?? null,
      }
    }
  }

  return map
}
