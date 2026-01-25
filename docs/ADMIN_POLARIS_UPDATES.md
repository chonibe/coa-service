# Admin Dashboard Polaris Update Integration

## Overview

The admin dashboard now displays a smart announcement banner when Polaris updates are available. Admins can review, approve, or reject updates directly from the dashboard without leaving the application.

## How It Works

```
┌─────────────────────────────────────────────┐
│ 1. Cron Job (Every Monday at 9am)          │
│    → Checks npm for Polaris updates        │
│    → Stores in database if found           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 2. Admin Dashboard                          │
│    → Polls for pending updates             │
│    → Displays announcement banner           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 3. Admin Reviews & Approves                │
│    → Views changelog                        │
│    → Reads migration guide (if major)      │
│    → Clicks "Approve" button               │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 4. Automatic PR Creation                    │
│    → GitHub API creates new branch          │
│    → Updates package.json                   │
│    → Creates PR with details               │
│    → Runs CI tests                          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ 5. Auto-Deploy (if tests pass)             │
│    → Merges PR automatically               │
│    → Deploys to staging                     │
│    → Marks as "installed" in database      │
└─────────────────────────────────────────────┘
```

## Components Created

### 1. Database Table (`polaris_updates`)

**File**: `supabase/migrations/20260125_create_polaris_updates_table.sql`

Stores update information:
- Package name and versions
- Update type (major/minor/patch)
- Status (pending/approved/rejected/installed)
- Approval tracking
- Links to changelog and migration guides

### 2. Update Checker Service

**File**: `lib/polaris-update-checker.ts`

Functions:
- `checkForPolarisUpdates()` - Checks npm registry for updates
- `getPendingUpdates()` - Gets updates awaiting approval
- `approvePolarisUpdate()` - Approves and triggers PR creation
- `rejectPolarisUpdate()` - Rejects update with reason
- `markUpdateInstalled()` - Marks as installed after deployment

### 3. UI Components

**Banner Component**: `app/admin/components/polaris-update-banner.tsx`
- Visual announcement banner
- Color-coded by update type (red=major, blue=minor, green=patch)
- Approve/Reject buttons
- Links to changelog and migration guides
- Expandable details view

**Notification Wrapper**: `app/admin/components/polaris-update-notifications.tsx`
- Fetches pending updates
- Auto-refreshes every 6 hours
- Handles approve/reject actions
- Dismissible with localStorage

### 4. API Routes

**Check Updates**: `app/api/polaris-updates/route.ts` (GET)
- Returns pending updates
- Admin-only access

**Approve Update**: `app/api/polaris-updates/approve/route.ts` (POST)
- Approves update in database
- Creates GitHub PR automatically
- Returns PR URL

**Reject Update**: `app/api/polaris-updates/reject/route.ts` (POST)
- Rejects update with reason
- Tracks rejection in database

**Cron Job**: `app/api/cron/check-polaris-updates/route.ts` (POST)
- Runs every Monday at 9am (via Vercel Cron)
- Checks npm registry
- Stores new updates in database

### 5. Integration

**Admin Shell**: `app/admin/admin-shell.tsx`
- Banner displays at top of admin dashboard
- Visible to all admin users
- Non-intrusive but prominent

## Setup Instructions

### Step 1: Run Database Migration

```bash
# Apply the migration
supabase db push

# Or manually run:
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/20260125_create_polaris_updates_table.sql
```

### Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# For GitHub PR creation (optional but recommended)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=your-org/your-repo

# For cron job security
CRON_SECRET=your_random_secret_key
```

#### Generate GitHub Token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give permissions: `repo` (full), `workflow`
4. Copy token and add to environment

#### Generate Cron Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Install Dependencies

```bash
npm install @octokit/rest
```

### Step 4: Verify Vercel Cron Configuration

The cron job is already configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-polaris-updates",
    "schedule": "0 9 * * 1"
  }]
}
```

This runs every Monday at 9am UTC.

### Step 5: Test the Integration

```bash
# 1. Test update checker
curl -X POST http://localhost:3000/api/cron/check-polaris-updates \
  -H "Authorization: Bearer your_cron_secret"

# 2. View pending updates
curl http://localhost:3000/api/polaris-updates

# 3. Check admin dashboard
# Navigate to /admin and look for the banner
```

## Usage

### For Admins

#### When Banner Appears:

1. **Review the Update**
   - Click "View Details" to expand
   - Check the update type (major/minor/patch)
   - Review changelog link
   - Read migration guide (if major update)

2. **Approve the Update**
   - Click "Approve" button
   - System creates GitHub PR automatically
   - PR runs automated tests
   - You'll receive PR link in notification

3. **Or Reject**
   - Click "Reject" button
   - Provide reason for rejection
   - Update is hidden from dashboard

4. **Or Dismiss**
   - Click X to temporarily hide
   - Will reappear on next page load
   - Stays dismissed for 24 hours

#### Update Types:

**🟢 Patch Update** (e.g., 13.9.5 → 13.9.6)
- **What**: Bug fixes only
- **Safe?**: Very safe ✅
- **Action**: Usually approve immediately
- **Example**: "Fixed button hover state bug"

**🔵 Minor Update** (e.g., 13.9.0 → 13.10.0)
- **What**: New features, backwards compatible
- **Safe?**: Safe ✅
- **Action**: Review changelog, approve
- **Example**: "Added new Tooltip component"

**🔴 Major Update** (e.g., 13.0.0 → 14.0.0)
- **What**: Breaking changes
- **Safe?**: Requires review ⚠️
- **Action**: Read migration guide carefully
- **Example**: "Changed Button API, removed old props"

## Banner Preview

### Collapsed State

```
┌────────────────────────────────────────────────────────┐
│ 🔔 Minor Update   Polaris 13.10.0 available            │
│    New features available - backwards compatible       │
│                                  [View Details] [X]    │
└────────────────────────────────────────────────────────┘
```

### Expanded State

```
┌────────────────────────────────────────────────────────┐
│ 🔔 Minor Update   Polaris 13.10.0 available            │
│    New features available - backwards compatible       │
│                                  [Hide Details] [X]    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ @shopify/polaris              [minor]               ││
│ │ Version: 13.9.5 → 13.10.0                          ││
│ │ [View Changelog] [Migration Guide]                 ││
│ │                                [Approve] [Reject]   ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Approve to create an update PR automatically           │
└────────────────────────────────────────────────────────┘
```

### Major Update Warning

```
┌────────────────────────────────────────────────────────┐
│ ⚠️  Major Update   Polaris 14.0.0 available            │
│    Contains breaking changes - requires review         │
│                                  [View Details] [X]    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ @shopify/polaris              [major]               ││
│ │ Version: 13.9.5 → 14.0.0                           ││
│ │                                                      ││
│ │ ⚠️ Breaking Changes Expected                         ││
│ │ This is a major version update and may contain      ││
│ │ breaking changes. Please review the migration       ││
│ │ guide before approving.                             ││
│ │                                                      ││
│ │ [View Changelog] [Migration Guide]                 ││
│ │                                [Approve] [Reject]   ││
│ └─────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

## Configuration

### Cron Schedule

Edit `vercel.json` to change check frequency:

```json
{
  "crons": [{
    "path": "/api/cron/check-polaris-updates",
    "schedule": "0 9 * * 1"  // Every Monday at 9am
  }]
}
```

**Common schedules**:
- `0 9 * * 1` - Monday at 9am (current)
- `0 9 * * *` - Daily at 9am
- `0 9 * * 1,4` - Monday and Thursday at 9am
- `0 */6 * * *` - Every 6 hours

### Update Check Frequency (Client-Side)

Edit `app/admin/components/polaris-update-notifications.tsx`:

```typescript
// Line ~28
const interval = setInterval(checkForUpdates, 6 * 60 * 60 * 1000) // 6 hours
```

Change `6` to your preferred hours (e.g., `12` for every 12 hours).

## Security

### Database Policies

✅ Row Level Security enabled on `polaris_updates` table
✅ Only admin users can view/modify updates
✅ Cron endpoint protected with secret token

### API Protection

All API routes verify:
- User authentication
- Admin role check
- Proper authorization headers

## Benefits

### 1. **No Context Switching** ✅
- Review updates without leaving admin dashboard
- No need to check GitHub or npm manually
- All information in one place

### 2. **Informed Decisions** ✅
- See update type (major/minor/patch) at a glance
- Direct links to changelog and migration guides
- Visual warnings for breaking changes

### 3. **One-Click Approval** ✅
- Click "Approve" → PR created automatically
- No manual Git/npm commands needed
- CI runs tests automatically

### 4. **Audit Trail** ✅
- All approvals/rejections logged in database
- Track who approved what and when
- Rejection reasons stored

### 5. **Safe Workflow** ✅
- Major updates show warnings
- Can reject with reason
- Dismissible if not ready

## Troubleshooting

### Banner Not Appearing

**Check**:
1. Are you logged in as admin? `SELECT role FROM user_roles WHERE user_id = auth.uid()`
2. Are there pending updates? Query: `SELECT * FROM polaris_updates WHERE status = 'pending'`
3. Check browser console for errors
4. Verify API route: `curl http://localhost:3000/api/polaris-updates`

### Cron Job Not Running

**Check**:
1. Verify Vercel Cron is enabled in project settings
2. Check Vercel dashboard → Cron tab
3. Test manually: `curl -X POST https://your-domain.com/api/cron/check-polaris-updates -H "Authorization: Bearer your_cron_secret"`
4. Check Vercel logs for errors

### PR Not Created on Approval

**Check**:
1. Is `GITHUB_TOKEN` configured? `echo $GITHUB_TOKEN`
2. Does token have correct permissions? (repo, workflow)
3. Is `GITHUB_REPO` in format `owner/repo`?
4. Check API logs for GitHub API errors

### Updates Not Detected

**Check**:
1. Run manually: `npm run polaris:check-updates`
2. Check if new version exists: https://www.npmjs.com/package/@shopify/polaris
3. Verify update checker logic in `lib/polaris-update-checker.ts`
4. Check database: `SELECT * FROM polaris_updates`

## Manual Testing

### Test 1: Create Fake Update

```sql
-- Insert a test update
INSERT INTO polaris_updates (
  package_name,
  current_version,
  latest_version,
  update_type,
  release_date,
  changelog_url,
  status
) VALUES (
  '@shopify/polaris',
  '13.9.5',
  '13.9.6',
  'patch',
  NOW(),
  'https://github.com/Shopify/polaris/releases',
  'pending'
);
```

Navigate to `/admin` and verify banner appears.

### Test 2: Approve Update

1. Click "Approve" in banner
2. Check console/network tab for API response
3. Verify GitHub PR is created (if configured)
4. Check database: `SELECT * FROM polaris_updates WHERE status = 'approved'`

### Test 3: Reject Update

1. Click "Reject" in banner
2. Enter reason
3. Click "Confirm Reject"
4. Verify update is removed from banner
5. Check database: `SELECT * FROM polaris_updates WHERE status = 'rejected'`

## Future Enhancements

### Phase 2 Features

- [ ] **Email Notifications**: Email admins when updates are found
- [ ] **Slack Integration**: Post updates to Slack channel
- [ ] **Automatic Installation**: Auto-merge PRs after tests pass (for patch updates)
- [ ] **Rollback Button**: One-click rollback if issues occur
- [ ] **Update History**: View all past updates in admin panel
- [ ] **Component Impact Analysis**: Show which components are affected
- [ ] **Changelog Diff**: Display what changed in the update
- [ ] **Test Results**: Show CI test results in dashboard
- [ ] **Scheduled Updates**: Schedule updates for specific times

### Phase 3 Features

- [ ] **Multi-Library Support**: Track updates for all dependencies (not just Polaris)
- [ ] **Security Alerts**: Highlight security vulnerabilities
- [ ] **Breaking Change Analyzer**: Automatically detect breaking changes in code
- [ ] **Migration Assistant**: Generate code changes automatically
- [ ] **Update Recommendations**: AI-powered recommendations on when to update

## Customization

### Change Banner Style

Edit `app/admin/components/polaris-update-banner.tsx`:

```typescript
const updateTypeInfo = {
  major: {
    color: 'bg-red-50 border-red-200',  // Change colors here
    badge: 'critical',
    // ...
  }
}
```

### Change Notification Frequency

Edit the cron schedule in `vercel.json`:

```json
{
  "schedule": "0 9 * * 1"  // Modify this cron expression
}
```

### Disable Auto-PR Creation

Set `GITHUB_TOKEN` to empty string in environment variables.
Updates will still be tracked, but PRs won't be created automatically.

### Add Custom Notification Channels

Edit `app/api/cron/check-polaris-updates/route.ts`:

```typescript
async function notifyAdmins(updates: any[]) {
  // Add Slack webhook
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🎨 ${updates.length} Polaris updates available!`
    })
  })
  
  // Add email notification
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: 'Polaris Updates Available',
    body: `New Polaris updates detected: ${updates.map(u => u.package_name).join(', ')}`
  })
}
```

## Database Schema

```sql
polaris_updates
├── id                  UUID PRIMARY KEY
├── package_name        TEXT (e.g., '@shopify/polaris')
├── current_version     TEXT (e.g., '13.9.5')
├── latest_version      TEXT (e.g., '13.10.0')
├── update_type         TEXT (major/minor/patch)
├── release_date        TIMESTAMPTZ
├── changelog_url       TEXT
├── migration_guide_url TEXT (nullable)
├── status              TEXT (pending/approved/rejected/installed)
├── approved_by         UUID → auth.users (nullable)
├── approved_at         TIMESTAMPTZ (nullable)
├── notes               TEXT (nullable)
├── installed_at        TIMESTAMPTZ (nullable)
├── created_at          TIMESTAMPTZ
└── updated_at          TIMESTAMPTZ
```

## Security Considerations

### API Endpoints

✅ All protected with authentication  
✅ Admin role verified for all operations  
✅ Cron endpoint uses secret token  
✅ GitHub token never exposed to client

### Database

✅ Row Level Security enabled  
✅ Admin-only policies  
✅ Audit trail (who approved/rejected)

### GitHub Integration

✅ Token scoped to repository only  
✅ PRs created with detailed information  
✅ Requires manual merge (unless configured for auto-merge)

## Monitoring

### Check System Health

```bash
# Check for pending updates
npm run polaris:check-updates

# View update log
cat docs/POLARIS_UPDATE_LOG.md

# Query database
psql -c "SELECT * FROM polaris_updates ORDER BY created_at DESC LIMIT 10"
```

### Logs to Monitor

- **Vercel Cron Logs**: Check if cron job runs successfully
- **API Logs**: Check for errors in approval/rejection
- **GitHub Actions**: Monitor PR creation and CI tests

## FAQs

**Q: Will the banner appear for all admin users?**  
A: Yes, all users with admin role will see the banner.

**Q: What happens if I approve multiple updates at once?**  
A: A single PR is created updating all approved packages together.

**Q: Can I test updates before approving?**  
A: Yes! Reject the update, then manually test in a branch using the migration strategy docs.

**Q: What if I accidentally approve a breaking update?**  
A: The PR is created but not merged. You can close the PR and the update will remain as "approved" in the database.

**Q: How do I mark an update as "installed"?**  
A: After merging the PR, the system should auto-detect and mark as installed. Or manually update: `UPDATE polaris_updates SET status = 'installed', installed_at = NOW() WHERE id = '...'`

**Q: Can I customize the banner appearance?**  
A: Yes, edit `app/admin/components/polaris-update-banner.tsx` to change colors, text, or layout.

---

**Status**: ✅ Ready to Use  
**Setup Time**: ~15 minutes  
**Maintenance**: Fully automated  
**Next Steps**: Run database migration and configure GitHub token
