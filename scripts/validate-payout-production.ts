#!/usr/bin/env npx ts-node

/**
 * Payout System Production Validation Script
 * 
 * Run this script before deploying the payout system to production.
 * It validates all required environment variables and tests API connectivity.
 * 
 * Usage: npx ts-node scripts/validate-payout-production.ts
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env' })

interface ValidationResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const results: ValidationResult[] = []

function check(name: string, condition: boolean, message: string, isWarning = false): void {
  if (condition) {
    results.push({ name, status: 'pass', message: `✅ ${message}` })
  } else {
    results.push({ name, status: isWarning ? 'warn' : 'fail', message: `${isWarning ? '⚠️' : '❌'} ${message}` })
  }
}

async function testPayPalConnectivity(): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const isProduction = process.env.PAYPAL_ENVIRONMENT === 'production'
  
  if (!clientId || !clientSecret) {
    return false
  }

  const baseUrl = isProduction 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    return response.ok
  } catch (error) {
    console.error('PayPal connectivity test failed:', error)
    return false
  }
}

async function main() {
  console.log('\n🔍 Payout System Production Validation\n')
  console.log('='.repeat(50))
  
  // 1. Check required environment variables
  console.log('\n📋 Environment Variables:\n')
  
  check(
    'PAYPAL_CLIENT_ID',
    !!process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_ID ? 'PAYPAL_CLIENT_ID is set' : 'PAYPAL_CLIENT_ID is missing'
  )
  
  check(
    'PAYPAL_CLIENT_SECRET',
    !!process.env.PAYPAL_CLIENT_SECRET,
    process.env.PAYPAL_CLIENT_SECRET ? 'PAYPAL_CLIENT_SECRET is set' : 'PAYPAL_CLIENT_SECRET is missing'
  )
  
  const paypalEnv = process.env.PAYPAL_ENVIRONMENT
  check(
    'PAYPAL_ENVIRONMENT',
    paypalEnv === 'production' || paypalEnv === 'sandbox',
    paypalEnv 
      ? `PAYPAL_ENVIRONMENT is set to "${paypalEnv}"` 
      : 'PAYPAL_ENVIRONMENT is not explicitly set (defaults to sandbox)'
  )
  
  if (paypalEnv !== 'production') {
    check(
      'PAYPAL_PRODUCTION_WARNING',
      false,
      'PAYPAL_ENVIRONMENT is not set to "production" - payouts will go to sandbox!',
      true
    )
  }
  
  check(
    'VENDOR_SESSION_SECRET',
    !!process.env.VENDOR_SESSION_SECRET,
    process.env.VENDOR_SESSION_SECRET ? 'VENDOR_SESSION_SECRET is set' : 'VENDOR_SESSION_SECRET is missing'
  )
  
  check(
    'SUPABASE_URL',
    !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL,
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) 
      ? 'Supabase URL is configured' 
      : 'Supabase URL is missing'
  )
  
  check(
    'SUPABASE_SERVICE_KEY',
    !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? 'Supabase service role key is set' 
      : 'Supabase service role key is missing'
  )

  // 2. Test PayPal API connectivity
  console.log('\n🔌 API Connectivity:\n')
  
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    console.log('Testing PayPal API connectivity...')
    const paypalConnected = await testPayPalConnectivity()
    check(
      'PAYPAL_API',
      paypalConnected,
      paypalConnected 
        ? 'PayPal API connection successful' 
        : 'PayPal API connection failed - check credentials'
    )
  } else {
    check('PAYPAL_API', false, 'Cannot test PayPal API - credentials missing')
  }

  // 3. Print summary
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 Validation Summary:\n')
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warned = results.filter(r => r.status === 'warn').length
  
  results.forEach(r => console.log(`  ${r.message}`))
  
  console.log('\n' + '-'.repeat(50))
  console.log(`\n  Total: ${results.length} checks`)
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⚠️  Warnings: ${warned}`)
  
  if (failed > 0) {
    console.log('\n❌ VALIDATION FAILED - Fix the issues above before deploying to production\n')
    process.exit(1)
  } else if (warned > 0) {
    console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings before deploying\n')
    process.exit(0)
  } else {
    console.log('\n✅ VALIDATION PASSED - Ready for production deployment\n')
    process.exit(0)
  }
}

main().catch(console.error)
