const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkAddressMatches() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  // Find Philip's address from #1182
  const p1182 = records.find(r => r['Name'] === '#1182');
  const street = p1182 ? p1182['Shipping Street'] : null;
  
  if (!street) {
    console.log('No street found for #1182.');
    return;
  }

  console.log(`Searching CSV for street: ${street}`);
  const matches = records.filter(r => 
    r['Shipping Street'] === street || r['Billing Street'] === street
  );

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => console.log(`- Order: ${m['Name']}, Email: ${m['Email']}, Name: ${m['Billing Name']}`));
}

checkAddressMatches();

