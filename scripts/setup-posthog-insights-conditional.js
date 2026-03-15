#!/usr/bin/env node
/**
 * Conditional PostHog Insights Setup Wrapper
 *
 * Runs setup-posthog-insights.js only if:
 * - POSTHOG_API_KEY and POSTHOG_PROJECT_ID are set
 * - VERCEL_ENV is 'production' or NODE_ENV is 'production'
 * - POSTHOG_SETUP_ENABLED is not 'false'
 *
 * This is called from package.json postbuild script during Vercel deployments.
 */

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID
const POSTHOG_SETUP_ENABLED = process.env.POSTHOG_SETUP_ENABLED !== 'false'
const VERCEL_ENV = process.env.VERCEL_ENV
const NODE_ENV = process.env.NODE_ENV

const isProduction = VERCEL_ENV === 'production' || NODE_ENV === 'production'

if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
  console.log('⏭️  Skipping PostHog insights setup: POSTHOG_API_KEY or POSTHOG_PROJECT_ID not set')
  process.exit(0)
}

if (!isProduction) {
  console.log(`⏭️  Skipping PostHog insights setup: not production (VERCEL_ENV=${VERCEL_ENV}, NODE_ENV=${NODE_ENV})`)
  process.exit(0)
}

if (!POSTHOG_SETUP_ENABLED) {
  console.log('⏭️  Skipping PostHog insights setup: POSTHOG_SETUP_ENABLED=false')
  process.exit(0)
}

console.log(`🚀 Running PostHog insights setup (VERCEL_ENV=${VERCEL_ENV}, NODE_ENV=${NODE_ENV})`)

// Import and run the main script
require('./setup-posthog-insights.js')
