/**
 * Instagram comment parser for giveaway entries
 * Extracts mentions and creates tagger/tagged pairs
 */

import { ParsedTag, ParsedEntry, WheelEntry } from './types'

/**
 * Instagram username regex pattern
 * Matches @username where username can contain letters, numbers, periods, underscores
 */
const USERNAME_REGEX = /@([a-zA-Z0-9._]+)/g

/**
 * Parse Instagram comments to extract entries
 * Each comment can have multiple @mentions
 * The first person in a comment is the tagger, all others are tagged
 *
 * Example:
 * "@alice @bob @charlie" = alice tags bob AND charlie (2 entries)
 * "@john @jane" = john tags jane (1 entry)
 */
export function parseInstagramComments(comments: string): ParsedEntry {
  const lines = comments
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const tags: ParsedTag[] = []
  const errors: string[] = []

  lines.forEach((line, commentIndex) => {
    // Extract all @mentions from the line
    const matches = [...line.matchAll(USERNAME_REGEX)]

    if (matches.length < 2) {
      // Need at least tagger and one tagged person
      if (matches.length === 1) {
        errors.push(
          `Line ${commentIndex + 1}: Only one mention found. Need at least 2 (@tagger @tagged).`
        )
      } else if (line.length > 0) {
        errors.push(`Line ${commentIndex + 1}: No mentions found. Expected @username format.`)
      }
      return
    }

    // First mention is the tagger
    const tagger = matches[0][1]

    // All other mentions are tagged users
    for (let i = 1; i < matches.length; i++) {
      const tagged = matches[i][1]

      // Skip self-tags
      if (tagger.toLowerCase() === tagged.toLowerCase()) {
        errors.push(
          `Line ${commentIndex + 1}: Self-tag detected (@${tagger}). Skipping this entry.`
        )
        continue
      }

      tags.push({
        tagger,
        tagged,
        commentIndex,
      })
    }
  })

  return {
    tags,
    totalEntries: tags.length,
    errors,
  }
}

/**
 * Convert parsed tags to wheel entries
 * Each tag becomes one entry on the wheel
 */
export function createWheelEntries(tags: ParsedTag[]): WheelEntry[] {
  return tags.map((tag, index) => ({
    id: `entry-${index}-${Date.now()}`,
    tagger: tag.tagger,
    tagged: tag.tagged,
    displayName: `@${tag.tagger} → @${tag.tagged}`,
  }))
}

/**
 * Validate and sanitize a single comment entry
 */
export function validateCommentEntry(entry: string): string[] {
  const errors: string[] = []

  // Check for minimum length
  if (entry.trim().length === 0) {
    errors.push('Comment is empty')
    return errors
  }

  // Check for at least one @mention
  const mentions = entry.match(USERNAME_REGEX)
  if (!mentions || mentions.length === 0) {
    errors.push('No @mentions found in comment')
    return errors
  }

  return errors
}

/**
 * Get statistics about parsed entries
 */
export function getParseStats(entries: ParsedEntry) {
  const taggers = new Set(entries.tags.map(t => t.tagger))
  const tagged = new Set(entries.tags.map(t => t.tagged))
  const allUsers = new Set([...taggers, ...tagged])

  return {
    totalEntries: entries.totalEntries,
    uniqueTaggers: taggers.size,
    uniqueTagged: tagged.size,
    uniqueUsers: allUsers.size,
    errorCount: entries.errors.length,
    mostActiveTagger: getMostActiveUser(entries.tags.map(t => t.tagger)),
  }
}

/**
 * Find the user with the most entries
 */
function getMostActiveUser(userList: string[]): { user: string; count: number } | null {
  if (userList.length === 0) return null

  const counts = userList.reduce(
    (acc, user) => {
      acc[user] = (acc[user] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0] ? { user: sorted[0][0], count: sorted[0][1] } : null
}

/**
 * Generate preview text for entries
 */
export function generatePreviewText(entries: WheelEntry[], maxPreview: number = 5): string {
  if (entries.length === 0) {
    return 'No entries found'
  }

  const preview = entries.slice(0, maxPreview).map(e => e.displayName).join('\n')
  const remaining = entries.length - maxPreview

  if (remaining > 0) {
    return `${preview}\n... and ${remaining} more entries`
  }

  return preview
}

/**
 * Calculate entry weights for weighted random selection
 * All entries have equal weight (1)
 */
export function calculateEntryWeights(entries: WheelEntry[]): number[] {
  return entries.map(() => 1)
}

/**
 * Weighted random selection
 */
export function selectWeightedRandomEntry(
  entries: WheelEntry[],
  weights: number[]
): WheelEntry {
  if (entries.length === 0) {
    throw new Error('Cannot select from empty entries')
  }

  if (entries.length !== weights.length) {
    throw new Error('Entries and weights must have same length')
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < entries.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return entries[i]
    }
  }

  // Fallback (shouldn't happen)
  return entries[entries.length - 1]
}
