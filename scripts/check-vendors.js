const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function checkVendors() {
  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  const vendors = ['Nurit Gross', 'Beto Val', 'Ori Toor'];
  
  console.log('Searching CSV for orders from specific vendors that might be missing emails...');
  const results = [];
  records.forEach(r => {
    if (vendors.includes(r['Vendor'])) {
       // Only look for rows where name or email might match common patterns or are empty
       if (!r['Email'] || r['Email'] === 'null' || (r['Billing Name'] && r['Billing Name'].toLowerCase().includes('philip'))) {
         results.push({
           order: r['Name'],
           email: r['Email'],
           billingName: r['Billing Name'],
           vendor: r['Vendor']
         });
       }
    }
  });

  console.log(`Found ${results.length} potential matches:`);
  results.forEach(res => console.log(JSON.stringify(res)));
}

checkVendors();

