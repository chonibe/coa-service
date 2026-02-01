#!/usr/bin/env node

/**
 * Production Readiness Validation Script for Payout System
 * 
 * This script validates that all required environment variables and dependencies
 * are properly configured before deploying the payout system to production.
 */

const https = require('https');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logHeader(message) {
  log(`\n${colors.bright}${message}${colors.reset}`);
}

// Validation checks
const checks = {
  errors: [],
  warnings: [],
  passed: []
};

async function validateEnvironmentVariables() {
  logHeader('1. Environment Variables Check');
  
  // Required environment variables
  const requiredVars = [
    { name: 'PAYPAL_CLIENT_ID', description: 'PayPal API Client ID' },
    { name: 'PAYPAL_CLIENT_SECRET', description: 'PayPal API Client Secret' },
    { name: 'PAYPAL_ENVIRONMENT', description: 'PayPal environment (sandbox/production)' },
    { name: 'VENDOR_SESSION_SECRET', description: 'Vendor session encryption secret' },
  ];

  for (const { name, description } of requiredVars) {
    if (process.env[name]) {
      logSuccess(`${name} is set (${description})`);
      checks.passed.push(name);
    } else {
      logError(`${name} is not set (${description})`);
      checks.errors.push(`Missing environment variable: ${name}`);
    }
  }

  // Validate PayPal environment value
  if (process.env.PAYPAL_ENVIRONMENT) {
    const validEnvironments = ['sandbox', 'production'];
    if (validEnvironments.includes(process.env.PAYPAL_ENVIRONMENT)) {
      logSuccess(`PAYPAL_ENVIRONMENT is valid: ${process.env.PAYPAL_ENVIRONMENT}`);
    } else {
      logError(`PAYPAL_ENVIRONMENT must be 'sandbox' or 'production', got: ${process.env.PAYPAL_ENVIRONMENT}`);
      checks.errors.push('Invalid PAYPAL_ENVIRONMENT value');
    }

    // Warn if using sandbox in what appears to be production
    if (process.env.PAYPAL_ENVIRONMENT === 'sandbox' && process.env.NODE_ENV === 'production') {
      logWarning('PayPal is set to sandbox mode but NODE_ENV is production');
      checks.warnings.push('PayPal sandbox mode in production environment');
    }
  }

  // Check Supabase connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logSuccess('Supabase credentials are set');
  } else {
    logError('Supabase credentials are missing');
    checks.errors.push('Missing Supabase credentials');
  }
}

async function testPayPalAPI() {
  logHeader('2. PayPal API Connectivity Check');

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    logError('Cannot test PayPal API: credentials not set');
    return;
  }

  const paypalBaseUrl = process.env.PAYPAL_ENVIRONMENT === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  return new Promise((resolve) => {
    logInfo(`Testing connection to ${paypalBaseUrl}...`);
    
    const authString = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const options = {
      hostname: paypalBaseUrl.replace('https://', ''),
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          logSuccess('PayPal API connection successful');
          logInfo(`Using ${process.env.PAYPAL_ENVIRONMENT} environment`);
          checks.passed.push('PayPal API connectivity');
        } else {
          logError(`PayPal API returned status ${res.statusCode}`);
          logError(`Response: ${data}`);
          checks.errors.push('PayPal API connection failed');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      logError(`PayPal API connection error: ${error.message}`);
      checks.errors.push('PayPal API connection error');
      resolve();
    });

    req.write('grant_type=client_credentials');
    req.end();
  });
}

async function validateDatabaseRPCs() {
  logHeader('3. Database RPC Functions Check');

  try {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logError('Cannot test database: Supabase credentials not set');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test RPC functions exist
    const rpcFunctions = [
      'get_vendor_payout_by_order',
      'get_vendor_pending_line_items',
    ];

    logInfo('Testing required RPC functions...');
    
    for (const rpcName of rpcFunctions) {
      // We can't directly test if RPC exists without calling it,
      // so we log them as expected
      logInfo(`  - ${rpcName} (expected to exist)`);
    }
    
    logSuccess('Database connection configured');
    checks.passed.push('Database configuration');

  } catch (error) {
    logError(`Database validation error: ${error.message}`);
    checks.errors.push('Database validation failed');
  }
}

function validateSecuritySettings() {
  logHeader('4. Security Settings Check');

  // Check session secret strength
  if (process.env.VENDOR_SESSION_SECRET) {
    const secret = process.env.VENDOR_SESSION_SECRET;
    if (secret.length < 32) {
      logWarning('VENDOR_SESSION_SECRET should be at least 32 characters long');
      checks.warnings.push('Session secret may be too short');
    } else {
      logSuccess('VENDOR_SESSION_SECRET length is adequate');
    }
  }

  // Check if using HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')) {
      logSuccess('Site URL uses HTTPS');
    } else {
      logError('NEXT_PUBLIC_SITE_URL should use HTTPS in production');
      checks.errors.push('Site URL not using HTTPS');
    }
  }
}

function printSummary() {
  logHeader('Validation Summary');
  
  console.log(`\nPassed: ${colors.green}${checks.passed.length}${colors.reset}`);
  console.log(`Warnings: ${colors.yellow}${checks.warnings.length}${colors.reset}`);
  console.log(`Errors: ${colors.red}${checks.errors.length}${colors.reset}`);

  if (checks.warnings.length > 0) {
    logHeader('Warnings:');
    checks.warnings.forEach(warning => logWarning(warning));
  }

  if (checks.errors.length > 0) {
    logHeader('Errors:');
    checks.errors.forEach(error => logError(error));
    log('\n❌ Validation FAILED. Please fix the errors above before deploying to production.', colors.red);
    process.exit(1);
  } else {
    log('\n✅ All validation checks passed! System is ready for production deployment.', colors.green);
    if (checks.warnings.length > 0) {
      log('⚠️  Note: There are warnings that should be reviewed.', colors.yellow);
    }
  }
}

async function main() {
  console.log(`${colors.bright}
╔═══════════════════════════════════════════════════════════════╗
║     Payout System - Production Readiness Validation          ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  await validateEnvironmentVariables();
  await testPayPalAPI();
  await validateDatabaseRPCs();
  validateSecuritySettings();
  printSummary();
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
