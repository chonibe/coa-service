#!/usr/bin/env node

/**
 * Clear Build Cache Script
 * 
 * Removes Next.js build cache and node_modules cache to fix stale JavaScript issues.
 */

const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    console.log(`🗑️  Deleting ${folderPath}...`);
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`✅ Deleted ${folderPath}`);
    return true;
  } else {
    console.log(`⚠️  ${folderPath} does not exist, skipping...`);
    return false;
  }
}

console.log('🔧 Clear Build Cache\n');
console.log('='.repeat(80));
console.log('\nThis script will remove:\n');
console.log('  - .next/ (Next.js build output)');
console.log('  - node_modules/.cache/ (Build tools cache)');
console.log('  - .swc/ (SWC compiler cache)');
console.log('\n' + '='.repeat(80) + '\n');

const rootDir = process.cwd();

const foldersToDelete = [
  path.join(rootDir, '.next'),
  path.join(rootDir, 'node_modules', '.cache'),
  path.join(rootDir, '.swc'),
];

let deletedCount = 0;

foldersToDelete.forEach(folder => {
  if (deleteFolderRecursive(folder)) {
    deletedCount++;
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n✨ Cache clearing complete! Deleted ${deletedCount} cache folder(s).\n`);
console.log('💡 Next steps:');
console.log('   1. Run "npm run build" to rebuild the application');
console.log('   2. Clear your browser cache or hard reload (Ctrl+Shift+R / Cmd+Shift+R)');
console.log('   3. Test the application\n');
console.log('='.repeat(80) + '\n');
