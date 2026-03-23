#!/usr/bin/env node
/**
 * Push cohort definitions from the repo to PostHog via the REST API (no MCP required).
 *
 * - Creates cohorts that do not exist (POST /api/projects/:id/cohorts/)
 * - PATCHes existing cohorts by name so filters match scripts/setup-posthog-insights.js
 *
 * Prerequisites (env — from shell or .env.local):
 *   POSTHOG_PERSONAL_API_KEY  (phx_..., recommended; needs cohort:write)
 *   POSTHOG_PROJECT_ID
 *   POSTHOG_HOST              (optional; e.g. https://eu.i.posthog.com for EU cloud)
 *
 * Optional:
 *   POSTHOG_UPDATE_EXISTING_COHORTS=false  — only create missing cohorts, skip PATCH
 *
 * @see https://posthog.com/docs/api/cohorts
 */

const path = require('path')
const fs = require('fs')

function loadEnvFile(file) {
  const p = path.join(process.cwd(), file)
  if (!fs.existsSync(p)) return
  try {
    require('dotenv').config({ path: p })
  } catch {
    /* dotenv optional at runtime if already in env */
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

// API host must match project region (EU vs US). Frontend already uses NEXT_PUBLIC_POSTHOG_HOST.
if (!process.env.POSTHOG_HOST && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  process.env.POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST
}

process.env.POSTHOG_COHORTS_ONLY = 'true'
if (process.env.POSTHOG_UPDATE_EXISTING_COHORTS === undefined) {
  process.env.POSTHOG_UPDATE_EXISTING_COHORTS = 'true'
}

require('./setup-posthog-insights.js')
