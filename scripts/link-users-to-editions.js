const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Finding all unique emails in line items...');
  const { data: emails, error } = await supabase
    .from('order_line_items_v2')
    .select('owner_email')
    .not('owner_email', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  const uniqueEmails = [...new Set(emails.map(e => e.owner_email))];
  console.log(`Found ${uniqueEmails.length} unique emails.`);

  console.log('\nLinking emails to Supabase user IDs...');
  let linkedCount = 0;

  for (const email of uniqueEmails) {
    // Check if user exists with this email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error(`Error fetching users:`, userError);
      continue;
    }

    const matchingUser = user.users.find(u => u.email === email);
    if (matchingUser) {
      // Update all line items with this email to set the owner_id
      const { data: updated, error: updateError } = await supabase
        .from('order_line_items_v2')
        .update({ owner_id: matchingUser.id })
        .eq('owner_email', email)
        .select('name');

      if (updateError) {
        console.error(`Error updating ${email}:`, updateError);
      } else {
        console.log(`✅ Linked ${email} to user ${matchingUser.id} (${updated.length} items)`);
        linkedCount++;
      }
    } else {
      console.log(`⚠️  No user found for ${email}`);
    }
  }

  console.log(`\nLinked ${linkedCount} out of ${uniqueEmails.length} emails to user accounts.`);
}

run();

