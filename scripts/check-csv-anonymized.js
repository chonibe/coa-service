const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkCSVAnonymized() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log('Searching CSV for Philip/Bittmann where Email is missing or "null"...');
  const matches = records.filter(r => 
    (!r['Email'] || r['Email'] === 'null') && 
    (
      (r['Billing Name'] && r['Billing Name'].toLowerCase().includes('philip')) ||
      (r['Shipping Name'] && r['Shipping Name'].toLowerCase().includes('philip')) ||
      (r['Billing Name'] && r['Billing Name'].toLowerCase().includes('bittmann')) ||
      (r['Shipping Name'] && r['Shipping Name'].toLowerCase().includes('bittmann'))
    )
  );

  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => console.log(JSON.stringify(m)));
}

checkCSVAnonymized();

