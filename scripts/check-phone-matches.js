const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkPhoneMatches() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  // Find Philip's phone from #1182
  const p1182 = records.find(r => r['Name'] === '#1182');
  const phone = p1182 ? (p1182['Phone'] || p1182['Shipping Phone'] || p1182['Billing Phone']) : null;
  
  if (!phone) {
    console.log('No phone found for #1182.');
    return;
  }

  console.log(`Searching CSV for phone: ${phone}`);
  const matches = records.filter(r => 
    r['Phone'] === phone || r['Shipping Phone'] === phone || r['Billing Phone'] === phone
  );

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => console.log(`- Order: ${m['Name']}, Email: ${m['Email']}, Name: ${m['Billing Name']}`));
}

checkPhoneMatches();

