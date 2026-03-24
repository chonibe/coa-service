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
  'experience_quiz_completed_flag',
  'experience_quiz_skipped_flag',
  'is_returning_user',
  'preferred_device',
  'experience_ab_variant',
  'has_purchased',
  'total_purchases',
  'has_added_to_cart',
  'has_saved_shipping_address',
  'visited_order_tracking',
  'has_used_promo_code',
  'shop_authenticated',
  'collector_onboarding_completed_flag',
  'collector_onboarding_skipped_flag',
  'experience_configurator_visited',
  'experience_started_count',
]

const verbose = process.argv.includes('--verbose') || process.env.POSTHOG_AUDIT_VERBOSE === 'true'

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
  const cohortsWithErrors = []
  for (const c of list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))) {
    const err = c.errors_calculating ? ` errors=${c.errors_calculating}` : ''
    const shortMsg = c.last_error_message ? ` last_error=${String(c.last_error_message).slice(0, 80)}` : ''
    console.log(
      `  ${c.count ?? '?'}\t${c.name}\t(id=${c.id})${c.is_calculating ? ' [calculating…]' : ''}${err}${shortMsg}`
    )
    if (c.last_error_message || c.errors_calculating) {
      cohortsWithErrors.push(c)
    }
  }
  console.log(`\n  Total cohort definitions: ${list.length}\n`)

  if (cohortsWithErrors.length > 0) {
    console.log('── Cohorts with calculation errors (full last_error_message) ──')
    for (const c of cohortsWithErrors) {
      console.log(`  id=${c.id} name=${c.name}`)
      if (c.last_error_message) console.log(`    ${String(c.last_error_message)}`)
      if (c.errors_calculating) console.log(`    errors_calculating=${c.errors_calculating}`)
      console.log('')
    }
  }

  if (verbose) {
    console.log('── Cohort raw filters (verbose) ──')
    for (const c of list.slice(0, 30)) {
      console.log(`  ${c.name} (id=${c.id}):`, JSON.stringify(c.filters || c).slice(0, 500))
    }
    console.log('')
  }

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
