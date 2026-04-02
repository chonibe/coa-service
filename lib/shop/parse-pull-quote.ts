/**
 * Split stored pull-quote strings (often "« quote » — Name, Source, year") into
 * body + optional attribution for blockquote / cite rendering.
 */
export type ParsedPullQuote = { quote: string; attribution?: string }

export function parsePullQuote(raw: string | undefined | null): ParsedPullQuote | null {
  const t = raw?.trim()
  if (!t) return null

  // « ... » — attribution (French)
  const fr = t.match(/^«\s*(.+?)\s*»\s*[—–-]\s*(.+)$/s)
  if (fr) {
    return { quote: fr[1].trim(), attribution: fr[2].trim() }
  }

  // „ ... “ — attribution (German opening quote)
  const de = t.match(/^„\s*(.+?)\s*“\s*[—–-]\s*(.+)$/s)
  if (de) {
    return { quote: de[1].trim(), attribution: de[2].trim() }
  }

  // "..." or "..." — attribution (straight or curly)
  const en = t.match(/^[""](.+?)[""]\s*[—–-]\s*(.+)$/s)
  if (en) {
    return { quote: en[1].trim(), attribution: en[2].trim() }
  }

  // Trailing — attribution (needs spaces around dash so "word—word" in-body dashes do not split)
  const tail = t.match(/^(.+?)\s+[—–-]\s+(.+)$/s)
  if (tail && tail[1].length >= 12) {
    const body = tail[1].trim()
    const attr = tail[2].trim()
    if (!/^https?:/i.test(attr)) {
      return { quote: body, attribution: attr }
    }
  }

  return { quote: t }
}
