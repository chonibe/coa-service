#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkPostgres() {
  console.log('🔍 Checking PostgreSQL status...');
  
  try {
    execSync('pg_isready', { stdio: 'pipe' });
    console.log('✅ PostgreSQL is running');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL is not running');
    console.log('\nTo start PostgreSQL:');
    console.log('1. brew services start postgresql@14');
    console.log('   or');
    console.log('2. pg_ctl -D /usr/local/var/postgres start');
    return false;
  }
}

function checkEnvFile() {
  console.log('\n🔍 Checking environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    
    if (fs.existsSync(envExamplePath)) {
      console.log('\nTo set up your environment:');
      console.log('1. cp .env.example .env');
      console.log('2. Update the values in .env with your configuration');
    }
    
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('DATABASE_URL=')) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('\nAdd your database URL to .env:');
    console.log('DATABASE_URL=postgresql://user:password@localhost:5432/database');
    return false;
  }
  
  console.log('✅ Environment configuration found');
  return true;
}

function checkSupabase() {
  console.log('\n🔍 Checking Supabase configuration...');
  
  const configPath = path.join(process.cwd(), 'supabase', 'config.toml');
  if (!fs.existsSync(configPath)) {
    console.error('❌ Supabase configuration not found');
    console.log('\nTo set up Supabase:');
    console.log('1. Install Supabase CLI');
    console.log('2. Run supabase init');
    return false;
  }
  
  console.log('✅ Supabase configuration found');
  return true;
}

function main() {
  console.log('🚀 Checking prerequisites...\n');
  
  const checks = [
    checkPostgres(),
    checkEnvFile(),
    checkSupabase()
  ];
  
  if (checks.every(check => check)) {
    console.log('\n✅ All prerequisites met! You can now run migrations.');
    process.exit(0);
  } else {
    console.error('\n❌ Some prerequisites are missing. Please fix the issues above before running migrations.');
    process.exit(1);
  }
}

main(); 