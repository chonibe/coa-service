const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkYanaiEmail() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  const email = 'yanai36@gmail.com';
  console.log(`Searching CSV for ${email}...`);
  const matches = records.filter(r => r['Email'] === email);

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => console.log(`- Order: ${m['Name']}, Name: ${m['Billing Name'] || m['Shipping Name']}`));
}

checkYanaiEmail();

