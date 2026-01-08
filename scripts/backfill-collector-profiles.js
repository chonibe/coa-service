const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Step 1: Finding all unique user IDs from edition ownership...');

  // Get all unique user IDs who own editions
  const { data: userIds, error: userError } = await supabase
    .from('order_line_items_v2')
    .select('owner_id')
    .not('owner_id', 'is', null)
    .not('owner_email', 'is', null);

  if (userError) {
    console.error('Error fetching user IDs:', userError);
    return;
  }

  const uniqueUserIds = [...new Set(userIds.map(u => u.owner_id).filter(id => id))];
  console.log(`Found ${uniqueUserIds.length} unique users with editions.`);

  console.log('\nStep 2: Creating collector profiles for users...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const userId of uniqueUserIds) {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('collector_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      skippedCount++;
      continue;
    }

    // Get user's auth info
    const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !userAuth.user) {
      console.error(`Could not get auth info for user ${userId}:`, authError);
      continue;
    }

    // Get the most recent order info for this user to populate profile
    const { data: recentEdition, error: editionError } = await supabase
      .from('order_line_items_v2')
      .select('owner_name, owner_email')
      .eq('owner_id', userId)
      .not('owner_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let firstName = null;
    let lastName = null;

    if (recentEdition?.owner_name) {
      const nameParts = recentEdition.owner_name.trim().split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = nameParts[0];
      }
    }

    // Create the profile
    const profileData = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: recentEdition?.owner_email || userAuth.user.email || '',
      phone: null,
      bio: null,
      avatar_url: null,
    };

    const { error: createError } = await supabase
      .from('collector_profiles')
      .insert(profileData);

    if (createError) {
      console.error(`Error creating profile for user ${userId}:`, createError);
    } else {
      createdCount++;
      console.log(`✅ Created profile for ${userId}: ${firstName || 'Unknown'} ${lastName || ''} (${recentEdition?.owner_email || 'no email'})`);
    }
  }

  console.log('\n--- Backfill Summary ---');
  console.log(`Total users processed: ${uniqueUserIds.length}`);
  console.log(`Profiles created: ${createdCount}`);
  console.log(`Profiles skipped (already exist): ${skippedCount}`);
}

run();

