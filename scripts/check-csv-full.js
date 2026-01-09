const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkCSVFull() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log('Scanning CSV for ANY mention of "bittmann"...');
  const results = [];
  records.forEach(r => {
    const rowStr = JSON.stringify(r).toLowerCase();
    if (rowStr.includes('bittmann')) {
      results.push({
        order: r['Name'],
        email: r['Email'],
        billingName: r['Billing Name'],
        shippingName: r['Shipping Name'],
        vendor: r['Vendor'],
        lineItem: r['Lineitem name']
      });
    }
  });

  console.log(`Found ${results.length} matching rows:`);
  results.forEach(res => console.log(JSON.stringify(res)));
}

checkCSVFull();

