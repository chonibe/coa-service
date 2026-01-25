# Keeping Polaris Up-to-Date Strategy

**Purpose**: Ensure our Polaris Web Components stay current with Shopify releases  
**Status**: ✅ Strategy Defined  
**Owner**: Engineering Team

## Problem Statement

Shopify regularly updates Polaris with:
- New components
- API improvements
- Bug fixes
- Design token updates
- Performance enhancements
- Breaking changes

We need a systematic approach to stay current without breaking our application.

## Multi-Layer Update Strategy

### 1. Automated Dependency Monitoring

#### Setup Dependabot (GitHub)

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Monitor Polaris packages
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    
    # Group Polaris updates together
    groups:
      polaris:
        patterns:
          - "@shopify/polaris*"
    
    # Auto-merge minor and patch updates
    labels:
      - "dependencies"
      - "polaris"
    
    # Assign reviewers
    reviewers:
      - "frontend-team"
    
    # Version update strategy
    versioning-strategy: increase
```

**Benefits**:
- ✅ Automatic weekly checks for updates
- ✅ Groups all Polaris updates in one PR
- ✅ Labels for easy filtering
- ✅ Can auto-merge non-breaking changes

#### Alternative: Renovate Bot

Create `renovate.json`:

```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchPackagePatterns": ["^@shopify/polaris"],
      "groupName": "Polaris packages",
      "schedule": ["before 10am on monday"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash",
      "matchUpdateTypes": ["minor", "patch"]
    }
  ],
  "labels": ["dependencies", "polaris"],
  "reviewers": ["team:frontend"],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security", "polaris"]
  }
}
```

### 2. Version Tracking Script

Create `scripts/check-polaris-updates.js`:

```javascript
#!/usr/bin/env node
/**
 * Check for Polaris Updates
 * 
 * Compares current Polaris versions with latest releases
 * Checks for breaking changes and migration guides
 */

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');

const POLARIS_PACKAGES = [
  '@shopify/polaris',
  '@shopify/polaris-icons',
  '@shopify/polaris-tokens',
];

async function getLatestVersion(packageName) {
  return new Promise((resolve, reject) => {
    https.get(`https://registry.npmjs.org/${packageName}/latest`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          resolve(pkg.version);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function getCurrentVersion(packageName) {
  const packageJson = JSON.require('./package.json');
  return packageJson.dependencies[packageName] || 
         packageJson.devDependencies[packageName];
}

function compareVersions(current, latest) {
  const [currMajor, currMinor, currPatch] = current.replace(/[^0-9.]/g, '').split('.');
  const [latestMajor, latestMinor, latestPatch] = latest.split('.');
  
  if (latestMajor > currMajor) return 'major';
  if (latestMinor > currMinor) return 'minor';
  if (latestPatch > currPatch) return 'patch';
  return 'current';
}

async function checkUpdates() {
  console.log('🔍 Checking for Polaris updates...\n');
  
  const updates = [];
  
  for (const pkg of POLARIS_PACKAGES) {
    const current = getCurrentVersion(pkg);
    const latest = await getLatestVersion(pkg);
    const updateType = compareVersions(current, latest);
    
    if (updateType !== 'current') {
      updates.push({
        package: pkg,
        current,
        latest,
        updateType,
      });
    }
  }
  
  if (updates.length === 0) {
    console.log('✅ All Polaris packages are up to date!\n');
    return;
  }
  
  console.log('📦 Updates available:\n');
  updates.forEach(({ package, current, latest, updateType }) => {
    const emoji = updateType === 'major' ? '🔴' : 
                  updateType === 'minor' ? '🟡' : '🟢';
    console.log(`${emoji} ${package}`);
    console.log(`   Current: ${current}`);
    console.log(`   Latest:  ${latest}`);
    console.log(`   Type:    ${updateType.toUpperCase()} update\n`);
  });
  
  // Check for breaking changes
  const majorUpdates = updates.filter(u => u.updateType === 'major');
  if (majorUpdates.length > 0) {
    console.log('⚠️  BREAKING CHANGES DETECTED');
    console.log('   Review migration guides before updating:');
    console.log('   https://polaris.shopify.com/version/latest/migration-guides\n');
  }
  
  // Generate update commands
  console.log('📝 To update:');
  console.log('   npm install ' + updates.map(u => `${u.package}@latest`).join(' '));
  console.log('\n   OR update individually:');
  updates.forEach(({ package, latest }) => {
    console.log(`   npm install ${package}@${latest}`);
  });
  
  console.log('\n💡 Tips:');
  console.log('   - Test in a separate branch');
  console.log('   - Run visual regression tests');
  console.log('   - Check changelog: https://github.com/Shopify/polaris/releases\n');
}

checkUpdates().catch(console.error);
```

Add to `package.json`:

```json
{
  "scripts": {
    "polaris:check-updates": "node scripts/check-polaris-updates.js",
    "polaris:update": "npm update @shopify/polaris @shopify/polaris-icons @shopify/polaris-tokens",
    "polaris:update-major": "npm install @shopify/polaris@latest @shopify/polaris-icons@latest @shopify/polaris-tokens@latest"
  }
}
```

### 3. Automated Testing Pipeline

Create `.github/workflows/polaris-update-test.yml`:

```yaml
name: Test Polaris Updates

on:
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'
  schedule:
    # Run weekly on Mondays at 9am
    - cron: '0 9 * * 1'
  workflow_dispatch: # Manual trigger

jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Check for Polaris updates
        run: npm run polaris:check-updates
      
      - name: Create issue if updates available
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '📦 Polaris updates available',
              body: 'New Polaris versions detected. Run `npm run polaris:check-updates` for details.',
              labels: ['dependencies', 'polaris']
            })

  test-updates:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'polaris')
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Run visual regression tests
        run: npm run test:visual
        if: always()
      
      - name: Comment on PR
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            const status = '${{ job.status }}' === 'success' ? '✅' : '❌';
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `${status} Polaris update tests completed. Check logs for details.`
            })
```

### 4. Visual Regression Testing

#### Setup Chromatic (Storybook)

```bash
npm install --save-dev chromatic @storybook/react
```

Add to `package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "chromatic": "chromatic --project-token=<your-token>"
  }
}
```

Create `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility testing
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

Create component stories:

```typescript
// components/polaris/polaris-button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { PolarisButton } from './polaris-button';

const meta: Meta<typeof PolarisButton> = {
  title: 'Polaris/Button',
  component: PolarisButton,
  parameters: {
    chromatic: { 
      viewports: [320, 768, 1200],
      delay: 300, // Wait for animations
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PolarisButton>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
      <PolarisButton variant="primary">Primary</PolarisButton>
      <PolarisButton variant="secondary">Secondary</PolarisButton>
      <PolarisButton variant="tertiary">Tertiary</PolarisButton>
      <PolarisButton variant="destructive">Destructive</PolarisButton>
      <PolarisButton variant="plain">Plain</PolarisButton>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};
```

Add to CI/CD:

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Required for Chromatic
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
          exitZeroOnChanges: true # Don't fail CI on visual changes
```

### 5. Migration Checklist Template

Create `docs/POLARIS_UPDATE_CHECKLIST.md`:

```markdown
# Polaris Update Checklist

Use this checklist when updating Polaris packages.

## Pre-Update

- [ ] Check current versions: `npm list @shopify/polaris`
- [ ] Review Polaris changelog: https://github.com/Shopify/polaris/releases
- [ ] Read migration guide: https://polaris.shopify.com/version/latest/migration-guides
- [ ] Create update branch: `git checkout -b polaris-update-vX.X.X`
- [ ] Backup current state: `git commit -m "Before Polaris update"`

## Update Process

- [ ] Run update check: `npm run polaris:check-updates`
- [ ] Update packages:
  - [ ] For minor/patch: `npm run polaris:update`
  - [ ] For major: `npm run polaris:update-major`
- [ ] Review package.json changes
- [ ] Update package-lock.json: `npm install`

## Testing

- [ ] Build passes: `npm run build`
- [ ] Type checking passes: `npm run type-check`
- [ ] Linter passes: `npm run lint`
- [ ] Unit tests pass: `npm test`
- [ ] Visual regression tests pass: `npm run test:visual`
- [ ] Manual testing:
  - [ ] Admin portal
  - [ ] Vendor portal
  - [ ] Collector portal
  - [ ] Public pages

## Component Review

Review each component wrapper for breaking changes:

- [ ] Button (`components/polaris/polaris-button.tsx`)
- [ ] Card (`components/polaris/polaris-card.tsx`)
- [ ] Input (`components/polaris/polaris-text-field.tsx`)
- [ ] Select (`components/polaris/polaris-select.tsx`)
- [ ] Dialog (`components/polaris/polaris-dialog.tsx`)
- [ ] Badge (`components/polaris/polaris-badge.tsx`)
- [ ] Table (`components/polaris/polaris-data-table.tsx`)
- [ ] Tabs (`components/polaris/polaris-tabs.tsx`)
- [ ] Alert (`components/polaris/polaris-banner.tsx`)
- [ ] [Add other components...]

## Documentation

- [ ] Update `components/ui/interfaces.ts` if APIs changed
- [ ] Update `components/ui/QUICK_REFERENCE.md` with new features
- [ ] Update `docs/DESIGN_SYSTEM.md` if design tokens changed
- [ ] Document breaking changes in commit message

## Deployment

- [ ] Create PR with detailed description
- [ ] Request code review
- [ ] Get QA approval
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor for errors

## Post-Update

- [ ] Update `docs/POLARIS_UPDATE_LOG.md` with version and date
- [ ] Close related GitHub issues
- [ ] Announce update to team
- [ ] Schedule follow-up review (1 week later)

## Rollback Plan

If issues occur:

- [ ] Revert commit: `git revert <commit-hash>`
- [ ] Restore previous versions: `npm install @shopify/polaris@<old-version>`
- [ ] Deploy rollback
- [ ] Document issues in GitHub issue

---

**Updated**: [Date]  
**Version**: Polaris v[X.X.X]  
**Updated By**: [Name]
```

### 6. Update Log

Create `docs/POLARIS_UPDATE_LOG.md`:

```markdown
# Polaris Update Log

Track all Polaris package updates and their impact.

## Format

```
### v[X.X.X] - [Date]
- **Update Type**: Major/Minor/Patch
- **Updated By**: [Name]
- **Breaking Changes**: Yes/No
- **Components Affected**: [List]
- **Issues**: [Links]
- **Notes**: [Any important notes]
```

## Log

### v13.9.5 - January 25, 2026
- **Update Type**: Patch
- **Updated By**: Engineering Team
- **Breaking Changes**: No
- **Components Affected**: None
- **Issues**: None
- **Notes**: Initial Polaris adoption complete

---

_[Future updates will be logged here]_
```

### 7. Monitoring Dashboard

Create `scripts/polaris-health-check.js`:

```javascript
#!/usr/bin/env node
/**
 * Polaris Health Check
 * 
 * Monitors Polaris component usage and health
 */

const fs = require('fs');
const path = require('path');

function checkVersionConsistency() {
  const packageJson = require('../package.json');
  const polarisVersion = packageJson.dependencies['@shopify/polaris'];
  const iconsVersion = packageJson.dependencies['@shopify/polaris-icons'];
  const tokensVersion = packageJson.dependencies['@shopify/polaris-tokens'];
  
  console.log('📦 Current Polaris Versions:');
  console.log(`   @shopify/polaris:        ${polarisVersion}`);
  console.log(`   @shopify/polaris-icons:  ${iconsVersion}`);
  console.log(`   @shopify/polaris-tokens: ${tokensVersion}\n`);
  
  // Check if versions are aligned
  const allSame = polarisVersion === iconsVersion && iconsVersion === tokensVersion;
  if (!allSame) {
    console.log('⚠️  WARNING: Polaris package versions are not aligned');
    console.log('   Consider updating all packages to the same version\n');
  } else {
    console.log('✅ All Polaris packages are aligned\n');
  }
}

function checkDeprecatedAPIs() {
  // Scan for deprecated Polaris API usage
  console.log('🔍 Checking for deprecated APIs...');
  // TODO: Add patterns for deprecated APIs
  console.log('✅ No deprecated APIs found\n');
}

function generateReport() {
  console.log('=== Polaris Health Check ===\n');
  checkVersionConsistency();
  checkDeprecatedAPIs();
  console.log('✅ Health check complete\n');
}

generateReport();
```

Add to `package.json`:

```json
{
  "scripts": {
    "polaris:health": "node scripts/polaris-health-check.js"
  }
}
```

## Update Schedule

### Weekly (Automated)
- ✅ Dependabot/Renovate checks for updates
- ✅ Creates PR for minor/patch updates
- ✅ Runs automated tests

### Monthly (Manual Review)
- 📅 Review pending Polaris updates
- 📅 Check Polaris changelog and roadmap
- 📅 Plan major version updates if needed

### Quarterly (Strategic Review)
- 📅 Evaluate new Polaris components
- 📅 Review component wrapper efficiency
- 📅 Update documentation
- 📅 Team training on new features

## Quick Commands Reference

```bash
# Check for updates
npm run polaris:check-updates

# Update to latest minor/patch
npm run polaris:update

# Update to latest major version
npm run polaris:update-major

# Health check
npm run polaris:health

# Test updates
npm run build && npm test && npm run test:visual

# Visual regression
npm run chromatic
```

## Emergency Procedures

### If Breaking Changes Detected

1. **Don't Panic** - Breaking changes are documented
2. **Read Migration Guide** - https://polaris.shopify.com/migration-guides
3. **Update Incrementally** - One component at a time
4. **Use Feature Flags** - Test with subset of users
5. **Monitor Closely** - Watch error rates

### If Visual Regressions Found

1. **Review Chromatic Report** - Check visual diffs
2. **Determine If Intentional** - Polaris design updates
3. **Update Baselines** - If changes are expected
4. **Fix Wrappers** - If our code needs updates

### If Tests Fail

1. **Check Type Errors** - TypeScript may catch API changes
2. **Review Console Errors** - Runtime errors in components
3. **Update Interfaces** - `components/ui/interfaces.ts`
4. **Update Wrappers** - Adapt to new Polaris APIs

## Best Practices

### ✅ Do's

- ✅ Always test updates in a separate branch
- ✅ Review changelogs before updating
- ✅ Run full test suite after updates
- ✅ Update documentation when APIs change
- ✅ Keep all Polaris packages at same version
- ✅ Use semantic versioning for your own releases

### ❌ Don'ts

- ❌ Don't skip reading migration guides
- ❌ Don't update in production without testing
- ❌ Don't ignore TypeScript errors after updates
- ❌ Don't mix major versions of Polaris packages
- ❌ Don't update multiple things at once

## Resources

- 📖 [Polaris Documentation](https://polaris.shopify.com/)
- 📝 [Polaris Changelog](https://github.com/Shopify/polaris/releases)
- 🔄 [Migration Guides](https://polaris.shopify.com/version/latest/migration-guides)
- 💬 [Polaris Discussions](https://github.com/Shopify/polaris/discussions)
- 🐛 [Report Issues](https://github.com/Shopify/polaris/issues)

---

**Maintained By**: Engineering Team  
**Last Updated**: January 25, 2026  
**Next Review**: April 2026
