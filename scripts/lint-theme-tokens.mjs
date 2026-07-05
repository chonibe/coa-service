#!/usr/bin/env node
/**
 * Flags hardcoded theme anti-patterns in storefront UI.
 * Run: npm run lint:theme-tokens
 */
import { execSync } from 'node:child_process'

const PATTERNS = [
  'text-\\[#1a1a1a\\]',
  'border-\\[#1a1a1a\\]',
  'bg-\\[#f5f5f5\\]',
  'bg-white/?',
  'dark:bg-\\[#171515\\]',
  'bg-neutral-950',
  'text-neutral-950',
  'min-h-screen bg-white',
]

const PATHS = ['"app/(store)"', '"components/shop"', '"components/impact"']

let failed = false

for (const pattern of PATTERNS) {
  const out = execSync(
    `rg -n "${pattern}" ${PATHS.join(' ')} --glob '*.tsx' --glob '*.ts' --glob '*.css' 2>/dev/null || true`,
    { encoding: 'utf8', shell: '/bin/bash' }
  ).trim()

  if (out) {
    failed = true
    console.error(`\n❌ Pattern "${pattern}" found:\n${out}\n`)
  }
}

if (failed) {
  console.error(
    'Theme token lint failed. See docs/features/theme-toggle/README.md for replacements.'
  )
  process.exit(1)
}

console.log('✓ No hardcoded theme anti-patterns in storefront paths.')
