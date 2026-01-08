const fs = require('fs');
const path = require('path');

// Patterns to look for (common secret formats)
const PATTERNS = [
  { name: 'Supabase Anon Key', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9._-]{50,}/g },
  { name: 'Supabase Service Role Key', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9._-]{100,}/g },
  { name: 'Generic Secret', regex: /secret["']?\s*[:=]\s*["']([^"']{10,})["']/gi },
  { name: 'Generic Key', regex: /key["']?\s*[:=]\s*["']([^"']{10,})["']/gi },
  { name: 'Password', regex: /password["']?\s*[:=]\s*["']([^"']{8,})["']/gi },
  { name: 'Vercel Token', regex: /vc[a-z0-9]{24}/gi },
  { name: 'GitHub Token', regex: /gh[oprs]_[a-zA-Z0-9]{36}/g },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { name: 'PayPal Secret', regex: /E[A-Z0-9]{22}_[A-Z0-9]{22}/g }, // Simplified PayPal secret pattern
];

// Files to exclude from scanning
const EXCLUDE_FILES = [
  'scripts/scan-secrets.js',
  'package-lock.json',
  'node_modules',
  '.next',
];

// Files to always check even if they match patterns (like documentation files)
const WHITELIST_FILES = [
  'docs/VERCEL_DEPLOYMENT_ENV.md',
  'docs/VERCEL_ENV_VARIABLES.md',
  'README.md',
];

const filesToScan = process.argv.slice(2);

let foundSecrets = false;

filesToScan.forEach(file => {
  if (EXCLUDE_FILES.some(exclude => file.includes(exclude))) return;
  if (WHITELIST_FILES.includes(file)) {
    // For whitelisted files, we might still want to warn but not block
    // Or we skip blocking them.
    return;
  }

  try {
    const content = fs.readFileSync(file, 'utf8');
    PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          // Double check if the match is a placeholder
          if (match.toLowerCase().includes('your_') || 
              match.toLowerCase().includes('<your') ||
              match.toLowerCase().includes('placeholder')) {
            return;
          }

          console.error(`\x1b[31mError: Potential ${pattern.name} found in ${file}\x1b[0m`);
          console.error(`Match: ${match.substring(0, 20)}...`);
          foundSecrets = true;
        });
      }
    });
  } catch (err) {
    console.error(`Could not read file ${file}: ${err.message}`);
  }
});

if (foundSecrets) {
  console.error('\x1b[31mCommit blocked. Please remove secrets and move them to environment variables.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32mNo secrets found in staged files.\x1b[0m');
  process.exit(0);
}

