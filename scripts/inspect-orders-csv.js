const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function inspectCSV() {
  try {
    const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    console.log(`Total records: ${records.length}`);
    console.log('Headers:', Object.keys(records[0]));
    console.log('\nSample records (first 3):');
    console.log(JSON.stringify(records.slice(0, 3), null, 2));

    // Check for "Sophia Liang" in CSV
    const sophiaRecords = records.filter(r => 
      (r['Billing Name'] && r['Billing Name'].includes('Liang')) || 
      (r['Shipping Name'] && r['Shipping Name'].includes('Liang')) ||
      (r['Email'] && r['Email'].includes('liang'))
    );
    console.log(`\nFound ${sophiaRecords.length} records matching "Liang" in CSV.`);
    if (sophiaRecords.length > 0) {
      console.log('Sample "Liang" records:');
      console.log(JSON.stringify(sophiaRecords.slice(0, 5), null, 2));
    }
  } catch (err) {
    console.error('Error reading CSV:', err.message);
  }
}

inspectCSV();

