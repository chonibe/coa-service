#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runMigration() {
  try {
    console.log('🔄 Running database migration...\n');

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Run each migration
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        execSync(`psql "$DATABASE_URL" -f "${migrationPath}"`, {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ Successfully applied migration: ${file}\n`);
      } catch (error) {
        console.error(`❌ Error applying migration ${file}:`, error.message);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');

    // Run table validation
    console.log('\n🔍 Running v2 table validation...');
    try {
      execSync('node scripts/validate-v2-tables.js', { stdio: 'inherit' });
    } catch (error) {
      console.warn('\n⚠️ Table validation found issues that need attention');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration(); 