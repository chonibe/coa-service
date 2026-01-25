const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', 'mobile-nfc-writer/**']
});

const replacements = [
  { from: /from ['"]@\/components\/ui\/toaster['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/progress['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/separator['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/skeleton['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/collapsible['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/slider['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/drawer['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/hover-card['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/breadcrumb['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/menubar['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/navigation-menu['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/context-menu['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/input-otp['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/toggle-group['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/toggle['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/carousel['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/chart['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/aspect-ratio['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/resizable['"]/g, to: 'from "@/components/ui"' },
  { from: /from ['"]@\/components\/ui\/sonner['"]/g, to: 'from "@/components/ui"' }
];

let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`✓ Fixed ${file}`);
  }
});

console.log(`\nTotal files fixed: ${totalChanges}`);
