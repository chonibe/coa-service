const FOMO_SESSION_STORAGE_KEY = 'experience-fomo-session-id'
const FOMO_PRODUCTS_STORAGE_KEY = 'experience-fomo-products'

export const EXPERIENCE_FOMO_COUNT_MIN = 2
export const EXPERIENCE_FOMO_COUNT_MAX = 3

/** FNV-1a 32-bit hash for stable seeded values. */
export function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getExperienceFomoSessionId(): string {
  if (typeof window === 'undefined') return ''
  const existing = sessionStorage.getItem(FOMO_SESSION_STORAGE_KEY)?.trim()
  if (existing) return existing
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `fomo-${Date.now()}-${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem(FOMO_SESSION_STORAGE_KEY, id)
  return id
}

export function isExperienceFomoFeatureEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_EXPERIENCE_FOMO === '0') return false
  try {
    if (localStorage.getItem('experience-fomo-disabled') === '1') return false
  } catch {
    // localStorage may be blocked
  }
  const param = new URLSearchParams(window.location.search).get('experience_fomo')?.toLowerCase()
  if (param && ['0', 'false', 'no', 'off'].includes(param)) return false
  return true
}

/** ~40% of products show the pill (seeded per productId). */
export function isExperienceFomoGatedIn(productId: string): boolean {
  return hashSeed(`fomo-gate:${productId}`) % 100 < 40
}

export type ExperienceFomoCopyVariant = 'people' | 'collectors' | 'someone'

export type ExperienceFomoConfig = {
  showDelayMs: number
  copyVariant: ExperienceFomoCopyVariant
  initialCount: number
  driftIntervalMs: number
}

export type ExperienceFomoProductState = {
  count: number
  copyVariant: ExperienceFomoCopyVariant
  hasAppeared: boolean
  driftTick: number
}

function clampFomoCount(count: number): number {
  return Math.min(EXPERIENCE_FOMO_COUNT_MAX, Math.max(EXPERIENCE_FOMO_COUNT_MIN, Math.round(count)))
}

function isValidCopyVariant(value: unknown): value is ExperienceFomoCopyVariant {
  return value === 'people' || value === 'collectors' || value === 'someone'
}

function readAllProductStates(): Record<string, ExperienceFomoProductState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(FOMO_PRODUCTS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return {}

    const result: Record<string, ExperienceFomoProductState> = {}
    for (const [productId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      const record = value as Partial<ExperienceFomoProductState>
      if (typeof record.count !== 'number' || !isValidCopyVariant(record.copyVariant)) continue
      result[productId] = {
        count: clampFomoCount(record.count),
        copyVariant: record.copyVariant,
        hasAppeared: record.hasAppeared === true,
        driftTick: typeof record.driftTick === 'number' && record.driftTick >= 0 ? record.driftTick : 0,
      }
    }
    return result
  } catch {
    return {}
  }
}

function writeAllProductStates(states: Record<string, ExperienceFomoProductState>): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(FOMO_PRODUCTS_STORAGE_KEY, JSON.stringify(states))
  } catch {
    // sessionStorage may be blocked
  }
}

export function saveExperienceFomoProductState(
  productId: string,
  patch: Partial<ExperienceFomoProductState>
): ExperienceFomoProductState {
  const all = readAllProductStates()
  const current = all[productId]
  const next: ExperienceFomoProductState = {
    count: clampFomoCount(patch.count ?? current?.count ?? EXPERIENCE_FOMO_COUNT_MIN),
    copyVariant: patch.copyVariant ?? current?.copyVariant ?? 'collectors',
    hasAppeared: patch.hasAppeared ?? current?.hasAppeared ?? false,
    driftTick: patch.driftTick ?? current?.driftTick ?? 0,
  }
  all[productId] = next
  writeAllProductStates(all)
  return next
}

export function buildExperienceFomoConfig(sessionId: string, productId: string): ExperienceFomoConfig {
  const baseSeed = hashSeed(`${sessionId}:${productId}`)
  const delayRand = createSeededRandom(baseSeed ^ 0xa5a5a5a5)
  const copyRand = createSeededRandom(baseSeed ^ 0x5a5a5a5a)
  const countRand = createSeededRandom(baseSeed ^ 0x3c3c3c3c)
  const driftRand = createSeededRandom(baseSeed ^ 0xc3c3c3c3)

  const showDelayMs = 12_000 + Math.floor(delayRand() * 13_000)
  const copyRoll = copyRand()
  const copyVariant: ExperienceFomoCopyVariant =
    copyRoll < 1 / 3 ? 'people' : copyRoll < 2 / 3 ? 'collectors' : 'someone'
  const countRange = EXPERIENCE_FOMO_COUNT_MAX - EXPERIENCE_FOMO_COUNT_MIN + 1
  const initialCount = EXPERIENCE_FOMO_COUNT_MIN + Math.floor(countRand() * countRange)
  const driftIntervalMs = 20_000 + Math.floor(driftRand() * 25_001)

  return { showDelayMs, copyVariant, initialCount, driftIntervalMs }
}

export function getOrCreateExperienceFomoProductState(
  sessionId: string,
  productId: string
): { state: ExperienceFomoProductState; config: ExperienceFomoConfig } {
  const config = buildExperienceFomoConfig(sessionId, productId)
  const existing = readAllProductStates()[productId]

  if (existing) {
    return { state: existing, config }
  }

  const state: ExperienceFomoProductState = {
    count: clampFomoCount(config.initialCount),
    copyVariant: config.copyVariant,
    hasAppeared: false,
    driftTick: 0,
  }
  saveExperienceFomoProductState(productId, state)
  return { state, config }
}

/** Gently drift ±1 per tick, seeded so the path is stable for this session + product. */
export function nextExperienceFomoCount(
  current: number,
  sessionId: string,
  productId: string,
  tick: number
): number {
  const clamped = clampFomoCount(current)
  const rand = createSeededRandom(hashSeed(`${sessionId}:${productId}:drift:${tick}`))

  if (clamped <= EXPERIENCE_FOMO_COUNT_MIN) return clamped + 1
  if (clamped >= EXPERIENCE_FOMO_COUNT_MAX) return clamped - 1

  const delta = rand() < 0.5 ? -1 : 1
  return clampFomoCount(clamped + delta)
}

export function formatExperienceFomoMessage(variant: ExperienceFomoCopyVariant, count: number): string {
  switch (variant) {
    case 'people':
      return `${count} people viewing this edition`
    case 'collectors':
      return `${count} collectors viewing right now`
    case 'someone':
      return 'Someone is viewing this artwork'
  }
}
