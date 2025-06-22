#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OLD_TABLE_NAME = 'order_line_items';
const NEW_TABLE_NAME = 'order_line_items';
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'migrations-archive'
];
const IGNORE_FILES = [
  'validate-v2-tables.js',
  'package-lock.json',
  'yarn.lock'
];

// File patterns to check
const FILE_PATTERNS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.sql',
  '.md'
];

async function findFiles(dir) {
  const files = [];
  
  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      // Skip ignored directories and files
      if (IGNORE_DIRS.includes(entry.name)) continue;
      if (IGNORE_FILES.includes(entry.name)) continue;
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (FILE_PATTERNS.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function checkFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    if (line.includes(OLD_TABLE_NAME) && !line.includes(NEW_TABLE_NAME)) {
      // Ignore comments and strings that are part of migration explanations
      if (!line.trim().startsWith('--') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        issues.push({
          file: filePath,
          line: index + 1,
          content: line.trim()
        });
      }
    }
  });
  
  return issues;
}

async function validateDatabase() {
  try {
    // Check if table exists
    const tableCheck = execSync(`
      psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${NEW_TABLE_NAME}'
        );"
    `).toString().trim();

    if (tableCheck !== 't') {
      console.error(`❌ Table ${NEW_TABLE_NAME} does not exist in the database`);
      return false;
    }

    // Check if old table is still being used
    const oldTableUsage = execSync(`
      psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = '${OLD_TABLE_NAME}';"
    `).toString().trim();

    if (oldTableUsage !== '0') {
      console.warn(`⚠️ Old table ${OLD_TABLE_NAME} still exists in the database`);
    }

    return true;
  } catch (error) {
    console.error('Error validating database:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Starting v2 table validation...\n');
  
  // Check codebase
  console.log('Checking codebase for old table references...');
  const files = await findFiles(process.cwd());
  let totalIssues = 0;
  
  for (const file of files) {
    const issues = await checkFile(file);
    if (issues.length > 0) {
      totalIssues += issues.length;
      console.log(`\n📁 ${file}:`);
      issues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.content}`);
      });
    }
  }
  
  // Check database
  console.log('\nValidating database tables...');
  const dbValid = await validateDatabase();
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`Found ${totalIssues} reference(s) to old table name`);
  console.log(`Database validation: ${dbValid ? '✅ Passed' : '❌ Failed'}`);
  
  if (totalIssues > 0 || !dbValid) {
    console.log('\n⚠️ Action Required:');
    console.log('1. Update any remaining references to the old table name');
    console.log('2. Verify database schema and migrations');
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed!');
  }
}

main().catch(error => {
  console.error('Error running validation:', error);
  process.exit(1);
}); 