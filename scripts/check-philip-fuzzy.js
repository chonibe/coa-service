const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkPhilipFuzzy() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log('Searching CSV for fuzzy matches for Philip/Roma...');
  const matches = records.filter(r => 
    (r['Email'] && r['Email'].toLowerCase().startsWith('roma')) ||
    (r['Billing Name'] && r['Billing Name'].toLowerCase().startsWith('philip')) ||
    (r['Shipping Name'] && r['Shipping Name'].toLowerCase().startsWith('philip'))
  );

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => console.log(`- Order: ${m['Name']}, Email: ${m['Email']}, Name: ${m['Billing Name'] || m['Shipping Name']}`));
}

checkPhilipFuzzy();

