#!/usr/bin/env node

/**
 * Print the exact redirect URI to add in Google Cloud Console
 * for Supabase Google OAuth (fixes 401 invalid_client / "OAuth client was not found").
 *
 * Usage: node -r dotenv/config scripts/print-google-redirect-uri.js
 *        or: DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/print-google-redirect-uri.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ldmppmnpgdxueebkkpid.supabase.co"
const base = supabaseUrl.replace(/\/+$/, "")
const redirectUri = `${base}/auth/v1/callback`

console.log("")
console.log("Add this exact URL to your Google OAuth client's Authorized redirect URIs:")
console.log("")
console.log("  " + redirectUri)
console.log("")
console.log("Steps: Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID")
console.log("       → Authorized redirect URIs → Add URI → paste above → Save")
console.log("")
