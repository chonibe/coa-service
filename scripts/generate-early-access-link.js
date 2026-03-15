#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { generateEarlyAccessToken } = require('../lib/early-access-token')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  })
}

const artistSlug = process.argv[2]?.trim()
if (!artistSlug) {
  console.error('❌ Artist slug is required')
  console.error('\nUsage: node scripts/generate-early-access-link.js <artist-slug>')
  process.exit(1)
}

try {
  const token = generateEarlyAccessToken(artistSlug)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'
  const artistLink = `${baseUrl}/shop/artists/${artistSlug}?early_access=1&token=${encodeURIComponent(token)}`
  const experienceLink = `${baseUrl}/shop/experience?artist=${artistSlug}&unlisted=1&token=${encodeURIComponent(token)}`
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  console.log('\n✨ Early Access Link Generated\n')
  console.log('Artist Page:')
  console.log(artistLink)
  console.log('\nExperience Page:')
  console.log(experienceLink)
  console.log(`\nExpires: ${expiresAt.toISOString()}\n`)
} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
}
