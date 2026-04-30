const INTERNAL_BIO_PATTERNS = [
  /auto-extracted from primary source page/i,
  /\bverify before publishing\b/i,
  /\bweb research\b/i,
  /\bverify\b/i,
  /\bconfirm\w*\b/i,
  /\bbatch\s+\d+\b/i,
  /\bindexed search\b/i,
  /\bmap to exhibitions\b/i,
  /\bno dated .* found\b/i,
  /\binternal\b/i,
  /\benrichment pass\b/i,
  /\bmanual web enrichment\b/i,
  /\bauto image extract\b/i,
  /\[bio refined/i,
  /\bspreadsheet hygiene\b/i,
  /\bdo not merge identities\b/i,
  /\bbehance sign in explore jobs resources hire\b/i,
  /\bdownload on the app store\b/i,
  /\bget it on google play\b/i,
  /\bcookie preferences\b/i,
  /\bdo not sell or share my personal information\b/i,
  /\bnavigate to adobe\.com\b/i,
  /\badobe portfolio blog\b/i,
  /\bproject views\b/i,
  /\bappreciations\b/i,
  /\bfollowers\b/i,
  /\bfollowing\b/i,
  /\bbebutton-/i,
]

function hasInternalBioLanguage(s: string): boolean {
  return INTERNAL_BIO_PATTERNS.some((pattern) => pattern.test(s))
}

function cleanupBioText(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[^\S\r\n]+\n/g, '\n')
    .replace(/\n[^\S\r\n]+/g, '\n')
    .trim()
}

export function cleanPublicArtistBio(s: string | undefined): string | undefined {
  const cleaned = cleanupBioText(s || '')
  if (!cleaned) return undefined

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((p) => !hasInternalBioLanguage(p))

  const publicBio = paragraphs.join('\n\n').trim()
  return publicBio || undefined
}
