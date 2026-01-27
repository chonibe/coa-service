#!/usr/bin/env node

/**
 * Create Storage Buckets Script
 *
 * This script creates the required Supabase storage buckets for the COA Service.
 * Run this script to set up the storage infrastructure.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🪣 Creating Supabase Storage Buckets...\n');

// Check if supabase CLI is available
try {
  execSync('supabase --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Supabase CLI is not installed or not in PATH');
  console.log('Please install the Supabase CLI: https://supabase.com/docs/guides/cli');
  process.exit(1);
}

// Check if we're in a Supabase project
try {
  execSync('supabase status', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Not in a Supabase project directory');
  console.log('Please run this from the root of your Supabase project');
  process.exit(1);
}

const buckets = [
  {
    name: 'product-images',
    public: true,
    description: 'Product images, artwork images, vendor images'
  },
  {
    name: 'print-files',
    public: false,
    description: 'Print-ready files for production'
  },
  {
    name: 'vendor-signatures',
    public: true,
    description: 'Artist signature images displayed on artwork pages'
  }
];

console.log('📋 Buckets to create:');
buckets.forEach(bucket => {
  console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'}) - ${bucket.description}`);
});
console.log('');

buckets.forEach(bucket => {
  try {
    console.log(`🔨 Creating bucket: ${bucket.name}...`);

    const command = bucket.public
      ? `supabase storage create ${bucket.name} --public`
      : `supabase storage create ${bucket.name} --private`;

    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Successfully created ${bucket.name} bucket\n`);
  } catch (error) {
    // Check if bucket already exists (exit code 1)
    if (error.status === 1) {
      console.log(`ℹ️  Bucket '${bucket.name}' already exists, skipping...\n`);
    } else {
      console.error(`❌ Failed to create bucket '${bucket.name}':`, error.message);
      console.log(`You may need to create this bucket manually in the Supabase Dashboard.`);
      console.log(`See: docs/STORAGE_BUCKETS_SETUP.md for instructions.\n`);
    }
  }
});

console.log('🎉 Storage buckets setup complete!');
console.log('\n📖 Next steps:');
console.log('1. Configure RLS policies for each bucket (see docs/STORAGE_BUCKETS_SETUP.md)');
console.log('2. Test the signature upload functionality in the vendor profile page');
console.log('3. Verify that uploaded signatures appear on artwork pages');

console.log('\n📄 Documentation: docs/STORAGE_BUCKETS_SETUP.md');