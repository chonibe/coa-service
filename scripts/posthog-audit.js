#!/usr/bin/env node
/**
 * Read-only PostHog project audit: cohort sizes + recent persons sample.
 * Uses the same env as cohort sync (no UI clicks).
 *
 *   npm run posthog:audit
 *
 * Env: POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST or NEXT_PUBLIC_POSTHOG_HOST
 */

const path = require('path')
const fs = require('fs')

function loadEnvFile(file) {
  const p = path.join(process.cwd(), file)
  if (!fs.existsSync(p)) return
  try {
    require('dotenv').config({ path: p })
  } catch {
    /* ignore */
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const KEY = process.env.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_API_KEY
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID
let HOST =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  'https://us.i.posthog.com'

if (!KEY || !PROJECT_ID) {
  console.error('Missing POSTHOG_PERSONAL_API_KEY (or POSTHOG_API_KEY) and POSTHOG_PROJECT_ID in .env.local / .env')
  process.exit(1)
}

async function apiGet(p) {
  const url = `${HOST.replace(/\/$/, '')}/api/projects/${PROJECT_ID}${p}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}` },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${p}: ${text.slice(0, 400)}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function pickProps(props, keys) {
  const out = {}
  if (!props || typeof props !== 'object') return out
  for (const k of keys) {
    if (props[k] !== undefined && props[k] !== null) out[k] = props[k]
  }
  return out
}

const PERSON_KEYS = [
  'email',
  'last_session_entry_path',
  'quiz_purpose',
  'quiz_owns_lamp',
  'is_returning_user',
  'preferred_device',
  'experience_ab_variant',
]

async function main() {
  console.log(`\nPostHog audit — project ${PROJECT_ID} @ ${HOST}\n`)

  let cohorts
  try {
    cohorts = await apiGet('/cohorts/?limit=200')
  } catch (e) {
    console.error('Cohorts:', e.message)
    process.exit(1)
  }

  const list = cohorts.results || []
  console.log('── Cohorts (name → id → count → calculating) ──')
  for (const c of list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))) {
    const err = c.errors_calculating ? ` errors=${c.errors_calculating}` : ''
    const msg = c.last_error_message ? ` last_error=${String(c.last_error_message).slice(0, 80)}` : ''
    console.log(
      `  ${c.count ?? '?'}\t${c.name}\t(id=${c.id})${c.is_calculating ? ' [calculating…]' : ''}${err}${msg}`
    )
  }
  console.log(`\n  Total cohort definitions: ${list.length}\n`)

  let persons
  try {
    persons = await apiGet('/persons/?limit=25')
  } catch (e) {
    console.error('Persons:', e.message)
    console.log('\n(Personal API key may need person:read scope.)\n')
    process.exit(1)
  }

  const pr = persons.results || []
  console.log('── Recent persons (sample up to 25) ──')
  if (pr.length === 0) {
    console.log('  (none returned — project may have no ingested persons yet, or API filter)\n')
  } else {
    for (const p of pr) {
      const props = pickProps(p.properties, PERSON_KEYS)
      const extra = Object.keys(props).length ? JSON.stringify(props) : '(no tracked props)'
      console.log(`  ${p.distinct_id}\t${extra}`)
    }
    console.log(`\n  Showing ${pr.length} of ${persons.count ?? '?'} persons (API total count).\n`)
  }

  console.log('Done. Re-run after traffic; cohort counts update as PostHog recalculates.\n')
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
