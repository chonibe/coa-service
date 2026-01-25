#!/usr/bin/env node
/**
 * UI Migration Status Generator
 * 
 * Generates a markdown report showing the status of UI library migration.
 * Auto-detects component usage and migration progress.
 * 
 * Usage:
 *   node scripts/ui-migration-status.js
 *   npm run migration:status
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Components to track
const COMPONENTS = [
  // Core components (high priority)
  { name: 'Button', priority: 'high' },
  { name: 'Card', priority: 'high' },
  { name: 'Input', priority: 'high' },
  { name: 'Select', priority: 'high' },
  { name: 'Dialog', priority: 'high' },
  
  // Form components
  { name: 'Checkbox', priority: 'medium' },
  { name: 'Radio', priority: 'medium' },
  { name: 'Switch', priority: 'medium' },
  { name: 'Textarea', priority: 'medium' },
  
  // Layout components
  { name: 'Tabs', priority: 'medium' },
  { name: 'Table', priority: 'high' },
  { name: 'Badge', priority: 'low' },
  { name: 'Alert', priority: 'medium' },
  
  // Legacy components (still in use)
  { name: 'Tooltip', priority: 'medium', status: 'pending' },
  { name: 'Dropdown', priority: 'high', status: 'pending' },
  { name: 'Avatar', priority: 'medium', status: 'pending' },
  { name: 'Popover', priority: 'low', status: 'pending' },
  { name: 'Calendar', priority: 'low', status: 'keep' },
  { name: 'Command', priority: 'low', status: 'keep' },
];

function countUsage(componentName) {
  try {
    const result = execSync(
      `rg "<${componentName}[\\s>]" --type tsx -c`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    
    return result.trim().split('\n')
      .reduce((sum, line) => {
        const match = line.match(/:(\d+)$/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
  } catch (error) {
    return 0;
  }
}

function detectStatus(componentName) {
  // Check if component is in polaris/ directory
  const polarisPath = path.join(process.cwd(), 'components', 'polaris', `polaris-${componentName.toLowerCase()}.tsx`);
  if (fs.existsSync(polarisPath)) {
    return 'completed';
  }
  
  // Check if component is in ui/ directory (legacy)
  const uiPath = path.join(process.cwd(), 'components', 'ui', `${componentName.toLowerCase()}.tsx`);
  if (fs.existsSync(uiPath)) {
    return 'pending';
  }
  
  return 'unknown';
}

function getStatusEmoji(status) {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    case 'pending': return '⏳';
    case 'keep': return '📌';
    case 'blocked': return '🚫';
    default: return '❓';
  }
}

function getPriorityEmoji(priority) {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

console.log('🔍 Analyzing UI component usage...\n');

// Analyze all components
const componentData = COMPONENTS.map(comp => {
  const usage = countUsage(comp.name);
  const status = comp.status || detectStatus(comp.name);
  
  console.log(`   ${comp.name}: ${usage} usages, status: ${status}`);
  
  return {
    ...comp,
    usage,
    status,
  };
});

// Calculate statistics
const totalComponents = componentData.length;
const completedComponents = componentData.filter(c => c.status === 'completed').length;
const pendingComponents = componentData.filter(c => c.status === 'pending').length;
const keepComponents = componentData.filter(c => c.status === 'keep').length;
const percentComplete = Math.round((completedComponents / (totalComponents - keepComponents)) * 100);

// Generate markdown report
const now = new Date().toISOString().split('T')[0];
const markdown = `# UI Migration Status

**Last Updated**: ${now}  
**Migration**: Shadcn UI → Shopify Polaris Web Components

## Progress Overview

\`\`\`
Total Components: ${totalComponents}
Completed:        ${completedComponents} (${percentComplete}%)
Pending:          ${pendingComponents}
Keep As-Is:       ${keepComponents}
\`\`\`

### Progress Bar
${'█'.repeat(Math.floor(percentComplete / 5))}${'░'.repeat(20 - Math.floor(percentComplete / 5))} ${percentComplete}%

## Component Status

| Component | Status | Priority | Usage | Notes |
|-----------|--------|----------|-------|-------|
${componentData
  .sort((a, b) => {
    // Sort by status first, then by usage count
    const statusOrder = { completed: 0, in_progress: 1, pending: 2, keep: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.usage - a.usage;
  })
  .map(c => {
    const notes = c.status === 'keep' ? 'No Polaris equivalent' :
                  c.status === 'completed' ? 'Migrated to Polaris' :
                  c.usage > 50 ? 'High usage - careful migration' :
                  c.usage === 0 ? 'Not used - can remove' :
                  'Ready to migrate';
    
    return `| ${c.name} | ${getStatusEmoji(c.status)} ${c.status} | ${getPriorityEmoji(c.priority)} ${c.priority} | ${c.usage} | ${notes} |`;
  })
  .join('\n')}

## Next Steps

### High Priority (Do First)
${componentData
  .filter(c => c.priority === 'high' && c.status === 'pending')
  .map(c => `- [ ] **${c.name}** (${c.usage} usages) - ${c.status}`)
  .join('\n') || '_No high priority items pending_'}

### Medium Priority (Do Next)
${componentData
  .filter(c => c.priority === 'medium' && c.status === 'pending')
  .map(c => `- [ ] **${c.name}** (${c.usage} usages) - ${c.status}`)
  .join('\n') || '_No medium priority items pending_'}

### Low Priority (Do Last)
${componentData
  .filter(c => c.priority === 'low' && c.status === 'pending')
  .map(c => `- [ ] **${c.name}** (${c.usage} usages) - ${c.status}`)
  .join('\n') || '_No low priority items pending_'}

## Components to Keep

These components don't have Polaris equivalents and will remain:

${componentData
  .filter(c => c.status === 'keep')
  .map(c => `- **${c.name}** (${c.usage} usages) - Custom implementation`)
  .join('\n') || '_None_'}

## Migration Resources

- 📖 [Migration Strategy Guide](./UI_MIGRATION_STRATEGY.md)
- 📦 [Legacy Components Inventory](../components/ui/LEGACY_COMPONENTS.md)
- 🧹 [Cleanup Summary](../components/ui/CLEANUP_SUMMARY.md)
- 🎨 [Design System Documentation](./DESIGN_SYSTEM.md)

## Quick Commands

\`\`\`bash
# Find component usage
npm run find-usage <ComponentName>

# Update this report
npm run migration:status

# Run visual regression tests
npm run test:visual
\`\`\`

## Notes

- ✅ **Completed**: Fully migrated to Polaris
- 🔄 **In Progress**: Currently being migrated
- ⏳ **Pending**: Not yet started
- 📌 **Keep**: No Polaris equivalent, keeping custom implementation
- 🚫 **Blocked**: Waiting on dependency or design decision

---

*Auto-generated by scripts/ui-migration-status.js*
`;

// Write to file
const outputPath = path.join(process.cwd(), 'docs', 'UI_MIGRATION_STATUS.md');
fs.writeFileSync(outputPath, markdown);

console.log(`\n✅ Report generated: ${outputPath}\n`);
console.log(`📊 Migration Progress: ${percentComplete}%`);
console.log(`✅ Completed: ${completedComponents}/${totalComponents - keepComponents} components`);
console.log(`⏳ Pending: ${pendingComponents} components\n`);

if (pendingComponents > 0) {
  console.log('💡 Next steps:');
  const nextComponents = componentData
    .filter(c => c.priority === 'high' && c.status === 'pending')
    .slice(0, 3);
  
  if (nextComponents.length > 0) {
    nextComponents.forEach(c => {
      console.log(`   - Migrate ${c.name} (${c.usage} usages)`);
    });
  }
  console.log('\n📖 See docs/UI_MIGRATION_STRATEGY.md for migration guide\n');
}
