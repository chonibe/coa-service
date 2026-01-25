#!/usr/bin/env node

/**
 * Migration script to update component imports from individual files to unified export
 * This script updates imports to use the new Polaris component exports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Component mapping: old import path -> new unified import
const componentMap = {
  'card': ['Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle', 'CardFooter'],
  'button': ['Button'],
  'badge': ['Badge'],
  'alert': ['Alert', 'AlertDescription', 'AlertTitle'],
  'input': ['Input'],
  'select': ['Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue'],
  'dialog': ['Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle', 'DialogFooter'],
  'tabs': ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'],
  'table': ['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'],
  'checkbox': ['Checkbox'],
  'radio-group': ['RadioGroup', 'Radio'],
  'switch': ['Switch'],
  'textarea': ['Textarea'],
  'label': ['Label'],
};

// Files to keep using old imports (components without Polaris equivalents yet)
const keepOldImports = [
  'skeleton',
  'alert-dialog',
  'toast',
  'use-toast',
  'toaster',
  'sonner',
  'scroll-area',
  'separator',
  'dropdown-menu',
  'popover',
  'tooltip',
  'command',
  'calendar',
  'form',
  'sheet',
  'drawer',
  'avatar',
  'progress',
  'slider',
  'accordion',
  'collapsible',
  'hover-card',
  'context-menu',
  'menubar',
  'navigation-menu',
  'toggle',
  'toggle-group',
  'pagination',
  'breadcrumb',
  'resizable',
  'sidebar',
  'aspect-ratio',
  'carousel',
  'chart',
  'input-otp',
  'artwork-card',
  'certificate-modal',
  'nfc-pairing-wizard',
];

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find all component imports
  const importRegex = /import\s+{([^}]+)}\s+from\s+["']@\/components\/ui\/([^"']+)["']/g;
  const matches = [...content.matchAll(importRegex)];
  
  if (matches.length === 0) return false;
  
  // Group imports by component type
  const importsToUpdate = new Map();
  const importsToKeep = [];
  
  matches.forEach(match => {
    const [, importedComponents, componentPath] = match;
    const componentName = componentPath.split('/')[0]; // Get base component name
    
    // Check if we should keep old import
    if (keepOldImports.includes(componentName)) {
      importsToKeep.push(match[0]);
      return;
    }
    
    // Parse imported components
    const components = importedComponents
      .split(',')
      .map(c => c.trim())
      .filter(c => c);
    
    if (!importsToUpdate.has(componentName)) {
      importsToUpdate.set(componentName, new Set());
    }
    
    components.forEach(comp => {
      // Handle "as" aliases
      const [name, alias] = comp.split(' as ').map(s => s.trim());
      importsToUpdate.get(componentName).add(alias || name);
    });
  });
  
  // If we have components to update, create new unified import
  if (importsToUpdate.size > 0) {
    const allComponents = [];
    importsToUpdate.forEach((components, componentName) => {
      components.forEach(comp => allComponents.push(comp));
    });
    
    // Remove old imports
    matches.forEach(match => {
      const componentPath = match[2];
      const componentName = componentPath.split('/')[0];
      
      if (!keepOldImports.includes(componentName)) {
        content = content.replace(match[0], '');
        modified = true;
      }
    });
    
    // Add unified import
    const unifiedImport = `import { ${allComponents.join(', ')} } from "@/components/ui"`;
    
    // Find the last import statement and add after it
    const lastImportMatch = content.match(/^import\s+.*from\s+["'][^"']+["'];?\s*$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      content = content.slice(0, insertIndex) + '\n' + unifiedImport + content.slice(insertIndex);
      modified = true;
    }
    
    // Clean up extra blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
const appDir = path.join(__dirname, '..', 'app');
const componentsDir = path.join(__dirname, '..', 'components');

console.log('Finding files to migrate...');
const files = [
  ...findFiles(appDir),
  ...findFiles(componentsDir).filter(f => !f.includes('polaris') && !f.includes('ui/index'))
];

console.log(`Found ${files.length} files to check`);

let updatedCount = 0;
files.forEach(file => {
  try {
    if (updateImports(file)) {
      updatedCount++;
      console.log(`Updated: ${path.relative(process.cwd(), file)}`);
    }
  } catch (error) {
    console.error(`Error updating ${file}:`, error.message);
  }
});

console.log(`\nMigration complete! Updated ${updatedCount} files.`);
console.log('\nNote: Some components (Skeleton, Toast, etc.) still use old imports as they don\'t have Polaris equivalents yet.');
