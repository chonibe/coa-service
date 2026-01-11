const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function syncProfileNames() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  const emailToName = new Map();
  const emailToPhone = new Map();

  records.forEach(r => {
    const email = r['Email']?.toLowerCase().trim();
    if (!email) return;

    const name = r['Billing Name'] || r['Shipping Name'] || '';
    const phone = r['Phone'] || r['Billing Phone'] || r['Shipping Phone'] || '';

    if (name && !emailToName.has(email)) emailToName.set(email, name);
    if (phone && !emailToPhone.has(email)) emailToPhone.set(email, phone);
  });

  console.log(`Syncing names for ${emailToName.size} unique emails...`);

  let updated = 0;
  for (const [email, fullName] of emailToName.entries()) {
    const parts = fullName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    const { data: profile } = await supabase
      .from('collector_profiles')
      .select('id, first_name, last_name')
      .eq('email', email)
      .maybeSingle();

    if (profile) {
      const needsUpdate = !profile.first_name || profile.first_name === 'Guest' || !profile.last_name;
      
      if (needsUpdate) {
        console.log(`Updating profile for ${email}: ${firstName} ${lastName}`);
        await supabase
          .from('collector_profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: emailToPhone.get(email) || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        updated++;
      }
    }
  }

  console.log(`Done! Updated ${updated} profiles with correct names.`);
}

syncProfileNames();

