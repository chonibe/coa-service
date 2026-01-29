const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  console.log('Please ensure .env.local contains the correct Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrphanedSeriesMembers() {
  try {
    console.log('🔍 Finding orphaned artwork_series_members records...');

    // Find all series members with submission_id that don't exist in vendor_product_submissions
    const { data: orphanedMembers, error: orphanedError } = await supabase
      .rpc('find_orphaned_series_members');

    if (orphanedError) {
      console.error('❌ Error calling RPC function:', orphanedError);

      // Fallback: Manual query approach
      console.log('🔄 Using manual query approach...');

      // Get all series members with submission_id
      const { data: allMembers, error: membersError } = await supabase
        .from('artwork_series_members')
        .select('id, series_id, submission_id')
        .not('submission_id', 'is', null);

      if (membersError) {
        console.error('❌ Error fetching series members:', membersError);
        return;
      }

      console.log(`📊 Found ${allMembers?.length || 0} series members with submission_id`);

      // Check each submission_id
      const orphanedMembers = [];
      for (const member of allMembers || []) {
        const { data: submission, error: subError } = await supabase
          .from('vendor_product_submissions')
          .select('id')
          .eq('id', member.submission_id)
          .single();

        if (subError || !submission) {
          orphanedMembers.push(member);
        }
      }

      console.log(`🚨 Found ${orphanedMembers.length} orphaned records`);
      console.log('Orphaned records:', orphanedMembers.map(m => ({
        id: m.id,
        series_id: m.series_id,
        submission_id: m.submission_id
      })));
    } else {
      console.log(`🚨 Found ${orphanedMembers?.length || 0} orphaned records via RPC`);
      console.log('Orphaned records:', orphanedMembers);
    }

    if (!orphanedMembers || orphanedMembers.length === 0) {
      console.log('✅ No orphaned records found!');
      return;
    }

    // Ask user what to do
    console.log('\n🔧 Options:');
    console.log('1. Remove orphaned records (recommended)');
    console.log('2. Set submission_id to NULL (keeps series structure)');
    console.log('3. Just report (no changes)');

    // For now, let's remove them as that's the safest option
    console.log('\n🛠️ Removing orphaned records...');

    for (const member of orphanedMembers) {
      const { error: deleteError } = await supabase
        .from('artwork_series_members')
        .delete()
        .eq('id', member.id);

      if (deleteError) {
        console.error(`❌ Error deleting member ${member.id}:`, deleteError);
      } else {
        console.log(`✅ Deleted orphaned member ${member.id}`);
      }
    }

    console.log('\n🎉 Cleanup completed!');

  } catch (err) {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
  }
}

// Alternative: Create RPC function for better performance
async function createOrphanedMembersRPC() {
  console.log('🔧 Creating RPC function for finding orphaned members...');

  const rpcFunction = `
    CREATE OR REPLACE FUNCTION find_orphaned_series_members()
    RETURNS TABLE (
      id UUID,
      series_id UUID,
      submission_id UUID,
      series_name TEXT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        asm.id,
        asm.series_id,
        asm.submission_id,
        aseries.name as series_name
      FROM artwork_series_members asm
      LEFT JOIN vendor_product_submissions vps ON asm.submission_id = vps.id
      LEFT JOIN artwork_series aseries ON asm.series_id = aseries.id
      WHERE asm.submission_id IS NOT NULL
        AND vps.id IS NULL;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: rpcFunction });
    if (error) {
      console.error('❌ Error creating RPC function:', error);
    } else {
      console.log('✅ RPC function created successfully');
    }
  } catch (err) {
    console.error('❌ Failed to create RPC function:', err);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--create-rpc')) {
    createOrphanedMembersRPC();
  } else {
    fixOrphanedSeriesMembers();
  }
}

module.exports = { fixOrphanedSeriesMembers, createOrphanedMembersRPC };