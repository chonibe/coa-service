require('dotenv').config();
const { Client } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(`
      ALTER TABLE order_line_items 
      ADD COLUMN IF NOT EXISTS quantity INTEGER;
    `);

    console.log('Migration completed successfully');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await client.end();
  }
}

runMigration(); 