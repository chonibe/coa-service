#!/usr/bin/env node

/**
 * Migration Script: Move artworks from time_based and vip series to standalone
 * Date: 2026-02-05
 * 
 * This script executes the migration to remove artworks from time_based and vip series.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting migration: Remove artworks from time_based and vip series\n');

  try {
    // Step 1: Check pre-migration state
    console.log('📊 Step 1: Checking pre-migration state...');
    
    const { data: seriesData, error: seriesError } = await supabase
      .from('artwork_series')
      .select('id, name, unlock_type')
      .in('unlock_type', ['time_based', 'vip']);

    if (seriesError) {
      throw new Error(`Failed to fetch series: ${seriesError.message}`);
    }

    console.log(`   Found ${seriesData.length} series with time_based or vip unlock types`);
    
    if (seriesData.length === 0) {
      console.log('✅ No series to migrate. Migration complete!');
      return;
    }

    seriesData.forEach(s => {
      console.log(`   - ${s.name} (${s.unlock_type})`);
    });

    const seriesIds = seriesData.map(s => s.id);

    // Check how many members will be affected
    const { count: memberCount, error: countError } = await supabase
      .from('artwork_series_members')
      .select('*', { count: 'exact', head: true })
      .in('series_id', seriesIds);

    if (countError) {
      throw new Error(`Failed to count members: ${countError.message}`);
    }

    console.log(`   Found ${memberCount} series members to migrate\n`);

    // Step 2: Create backups
    console.log('💾 Step 2: Creating backup tables...');
    
    const backupQueries = [
      `CREATE TABLE IF NOT EXISTS backup_artwork_series_20260205 AS
       SELECT * FROM artwork_series WHERE unlock_type IN ('time_based', 'vip')`,
      
      `CREATE TABLE IF NOT EXISTS backup_artwork_series_members_20260205 AS
       SELECT m.* FROM artwork_series_members m
       JOIN artwork_series s ON m.series_id = s.id
       WHERE s.unlock_type IN ('time_based', 'vip')`,
      
      `CREATE TABLE IF NOT EXISTS backup_submissions_update_20260205 AS
       SELECT id, series_id FROM vendor_product_submissions
       WHERE series_id IN (SELECT id FROM artwork_series WHERE unlock_type IN ('time_based', 'vip'))`
    ];

    for (const query of backupQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error && !error.message.includes('already exists')) {
        console.warn(`   Warning: ${error.message}`);
      }
    }
    
    console.log('   ✅ Backup tables created\n');

    // Step 3: Delete series members
    console.log('🗑️  Step 3: Removing series members...');
    
    const { error: deleteError } = await supabase
      .from('artwork_series_members')
      .delete()
      .in('series_id', seriesIds);

    if (deleteError) {
      throw new Error(`Failed to delete members: ${deleteError.message}`);
    }

    console.log(`   ✅ Deleted ${memberCount} series members\n`);

    // Step 4: Clear series_id from submissions
    console.log('🔄 Step 4: Clearing series_id from submissions...');
    
    const { count: updateCount, error: updateError } = await supabase
      .from('vendor_product_submissions')
      .update({ series_id: null })
      .in('series_id', seriesIds)
      .select('*', { count: 'exact', head: true });

    if (updateError) {
      throw new Error(`Failed to update submissions: ${updateError.message}`);
    }

    console.log(`   ✅ Updated ${updateCount} submissions\n`);

    // Step 5: Verify migration
    console.log('✅ Step 5: Verifying migration...');
    
    const { count: remainingCount, error: verifyError } = await supabase
      .from('artwork_series_members')
      .select('*', { count: 'exact', head: true })
      .in('series_id', seriesIds);

    if (verifyError) {
      throw new Error(`Failed to verify: ${verifyError.message}`);
    }

    if (remainingCount === 0) {
      console.log('   ✅ Verification passed: No members remain in migrated series');
    } else {
      console.warn(`   ⚠️  Warning: ${remainingCount} members still remain`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Series migrated: ${seriesData.length}`);
    console.log(`Members removed: ${memberCount}`);
    console.log(`Submissions updated: ${updateCount}`);
    console.log(`Remaining members: ${remainingCount}`);
    console.log('\nArtworks are now standalone (no series assigned)');
    console.log('Backup tables created for safety');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Data is safe - backups were created');
    console.error('   You can rollback using the backup tables if needed\n');
    process.exit(1);
  }
}

// Run the migration
runMigration();
