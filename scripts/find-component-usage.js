#!/usr/bin/env node
/**
 * Find Component Usage Script
 * 
 * Finds all usages of a UI component in the codebase.
 * Useful for planning migrations and assessing impact.
 * 
 * Usage:
 *   node scripts/find-component-usage.js Button
 *   npm run find-usage Button
 */

const { execSync } = require('child_process');
const path = require('path');

const componentName = process.argv[2];

if (!componentName) {
  console.error('❌ Error: Please provide a component name');
  console.log('\nUsage: npm run find-usage <ComponentName>');
  console.log('Example: npm run find-usage Button\n');
  process.exit(1);
}

console.log(`\n🔍 Searching for ${componentName} usage...\n`);

try {
  // Find direct imports from @/components/ui
  console.log('📦 Direct imports from @/components/ui:');
  const directImports = execSync(
    `rg "import.*${componentName}.*from ['\\"]@/components/ui" --type tsx --type ts -n`,
    { encoding: 'utf-8', cwd: process.cwd() }
  );
  
  const lines = directImports.trim().split('\n');
  console.log(`   Found ${lines.length} files\n`);
  lines.forEach(line => console.log(`   ${line}`));
  
} catch (error) {
  if (error.status === 1) {
    console.log('   No direct imports found');
  } else {
    console.error('   Error searching:', error.message);
  }
}

try {
  // Find JSX usage
  console.log(`\n🏷️  JSX usage of <${componentName}>:`);
  const jsxUsage = execSync(
    `rg "<${componentName}[\\s>]" --type tsx -c`,
    { encoding: 'utf-8', cwd: process.cwd() }
  );
  
  const usageCount = jsxUsage.trim().split('\n')
    .reduce((sum, line) => {
      const match = line.match(/:(\d+)$/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
  
  console.log(`   Found ${usageCount} JSX usages`);
  
} catch (error) {
  if (error.status === 1) {
    console.log('   No JSX usage found');
  }
}

try {
  // Find in specific directories
  console.log('\n📂 Usage by directory:');
  const dirs = ['app/admin', 'app/vendor', 'app/collector', 'app/customer', 'components'];
  
  dirs.forEach(dir => {
    try {
      const result = execSync(
        `rg "<${componentName}[\\s>]" ${dir} --type tsx -c 2>/dev/null`,
        { encoding: 'utf-8', cwd: process.cwd() }
      );
      
      const count = result.trim().split('\n')
        .reduce((sum, line) => {
          const match = line.match(/:(\d+)$/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
      
      if (count > 0) {
        console.log(`   ${dir}: ${count} usages`);
      }
    } catch (e) {
      // Directory might not exist or have no matches
    }
  });
  
} catch (error) {
  // Ignore errors
}

try {
  // Find prop usage patterns
  console.log(`\n🎨 Common prop patterns:`);
  const propPatterns = [
    { name: 'variant', pattern: `variant=` },
    { name: 'size', pattern: `size=` },
    { name: 'disabled', pattern: `disabled` },
    { name: 'loading', pattern: `loading` },
    { name: 'onClick', pattern: `onClick=` }
  ];
  
  propPatterns.forEach(({ name, pattern }) => {
    try {
      const result = execSync(
        `rg "<${componentName}[^>]*${pattern}" --type tsx -c`,
        { encoding: 'utf-8', cwd: process.cwd() }
      );
      
      const count = result.trim().split('\n')
        .reduce((sum, line) => {
          const match = line.match(/:(\d+)$/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
      
      if (count > 0) {
        console.log(`   ${name}: ${count} usages`);
      }
    } catch (e) {
      // No matches
    }
  });
  
} catch (error) {
  // Ignore
}

console.log('\n✅ Search complete\n');
console.log('💡 Tip: Use this information to plan your migration strategy');
console.log('📖 See docs/UI_MIGRATION_STRATEGY.md for migration guide\n');
