/**
 * Edition narrative stages for limited-run artworks (default proportions match a 44-piece run;
 * thresholds scale by sold/total ratio for other edition sizes).
 */

export const editionStages = {
  early: {
    range: [1, 10] as const,
    badge: "You're early",
    subline: 'One of the first to collect {artist}',
    cta: 'Join {x} collectors who got here first',
    emailSubject: "You're one of {artist}'s first collectors",
    emailBody: 'Edition {n} of {total}. You got here early. Remember this moment.',
  },
  momentum: {
    range: [11, 30] as const,
    badge: 'Collecting momentum',
    subline: '{x} collectors have discovered {artist}',
    cta: 'Join a growing collector base',
    emailSubject: "You joined {artist}'s collector community",
    emailBody: "Edition {n} of {total}. This artist is being discovered. You're part of that story.",
  },
  breakthrough: {
    range: [31, 38] as const,
    badge: 'This artist is breaking through',
    subline: 'Over {x} collectors and growing fast',
    cta: 'Collect before this edition closes',
    emailSubject: 'You collected at the right moment',
    emailBody: "Edition {n} of {total}. The momentum is real. You'll want to remember you were here.",
  },
  scarce: {
    range: [39, 42] as const,
    badge: 'Almost gone',
    subline: 'Only {remaining} editions remaining. Ever.',
    cta: 'Secure your edition now',
    emailSubject: 'You got one of the last editions',
    emailBody: "Edition {n} of {total}. Only {remaining} left after yours. This one mattered.",
  },
  final: {
    range: [43, 44] as const,
    badge: 'Final editions',
    subline: 'This edition closes permanently after {remaining} more',
    cta: 'Last chance — edition closes forever',
    emailSubject: 'You got one of the last two. Ever.',
    emailBody:
      "Edition {n} of {total}. This is it. After the next one this artist's edition is closed permanently. You made it.",
  },
} as const

export type EditionStageKey = keyof typeof editionStages

/** Sold count through the run (units no longer available). */
export function getEditionStageKey(soldCount: number, totalEditions: number): EditionStageKey | null {
  if (totalEditions < 1 || soldCount < 0) return null
  const sold = Math.min(soldCount, totalEditions)
  const remaining = totalEditions - sold

  /* Last two units of the run (skip for tiny totals so a 2‑piece launch isn’t “final” at 0 sold). */
  if (totalEditions >= 3 && remaining <= 2 && sold >= totalEditions - 2) {
    return 'final'
  }

  const r = totalEditions > 0 ? sold / totalEditions : 0
  if (r <= 10 / 44) return 'early'
  if (r <= 30 / 44) return 'momentum'
  if (r <= 38 / 44) return 'breakthrough'
  if (r <= 42 / 44) return 'scarce'
  return 'final'
}

export type EditionCopyVars = {
  artist: string
  /** Collectors so far (sold count). */
  x: number
  /** Next edition index for the buyer (min(sold+1, total)). */
  n: number
  total: number
  remaining: number
}

export function interpolateEditionTemplate(template: string, vars: EditionCopyVars): string {
  return template
    .replace(/\{artist\}/g, vars.artist)
    .replace(/\{x\}/g, String(vars.x))
    .replace(/\{n\}/g, String(vars.n))
    .replace(/\{total\}/g, String(vars.total))
    .replace(/\{remaining\}/g, String(Math.max(0, vars.remaining)))
}

export function getEditionCopyForStage(
  stage: EditionStageKey,
  vars: EditionCopyVars
): {
  badge: string
  subline: string
  cta: string
  emailSubject: string
  emailBody: string
} {
  const cfg = editionStages[stage]
  return {
    badge: interpolateEditionTemplate(cfg.badge, vars),
    subline: interpolateEditionTemplate(cfg.subline, vars),
    cta: interpolateEditionTemplate(cfg.cta, vars),
    emailSubject: interpolateEditionTemplate(cfg.emailSubject, vars),
    emailBody: interpolateEditionTemplate(cfg.emailBody, vars),
  }
}
