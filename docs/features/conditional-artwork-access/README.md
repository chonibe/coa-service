# Conditional Artwork Access - View vs Interact Model

## Overview

This feature implements a "view freely, authenticate to interact" model for collector artwork pages. All artwork content (images, text, videos, artist info, and story timelines) is publicly viewable, but interactive capabilities (posting stories, adding voice notes, etc.) require NFC authentication.

## Version

- **Implemented**: 2026-02-01
- **Version**: 1.0.0

## Feature Purpose

Allow collectors to:
1. **View** all artwork content without authentication barriers
2. **Explore** artist profiles, content blocks, and community stories freely
3. **Authenticate** their physical artwork to unlock interactive capabilities
4. **Interact** by posting stories, recording voice notes, and engaging with content

## Technical Implementation

### API Changes

**File**: `app/api/collector/artwork/[id]/route.ts`

#### Key Changes:
1. **Content blocks always returned** - Removed authentication check wrapper
2. **New field added** - `canInteract: boolean` indicates permission to post/interact
3. **Locked preview conditional** - Only returned when unauthenticated AND content exists

```typescript
// Before
contentBlocks: isAuthenticated ? contentBlocks : [],
lockedContentPreview: !isAuthenticated ? lockedContentPreview : [],

// After
contentBlocks: contentBlocks, // Always return
lockedContentPreview: !isAuthenticated && hasBlocksToLock ? lockedContentPreview : [],
canInteract: isAuthenticated, // New field
```

### Frontend Changes

**File**: `app/collector/artwork/[id]/page.tsx`

#### Key Changes:
1. **New variable** - `canInteract` controls interaction permissions
2. **Conditional lock UI** - Only show unlock CTA when unlockable content exists
3. **Artist profile unlocked** - Always visible regardless of auth status
4. **Content blocks visible** - Removed locked overlay
5. **Story interactions locked** - `isOwner` now uses `canInteract` instead of `isAuthenticated`

```typescript
const canInteract = artwork.canInteract ?? isAuthenticated
const hasUnlockableContent = (artwork.lockedContentPreview?.length || 0) > 0
```

### Story Component Changes

**Files**: 
- `app/collector/artwork/[id]/components/story/SharedStoryTimeline.tsx`
- `app/collector/artwork/[id]/components/story/StoryCircles.tsx`
- `lib/story/types.ts`

#### Key Changes:
1. **Lock indicator** - Shows lock icon on "Add Story" button for non-authenticated users
2. **Auth callback** - `onAuthRequired` callback triggers authentication prompt
3. **Visual feedback** - Amber color scheme for locked interactions

```typescript
// Lock indicator in StoryCircles
{!isOwner && !isArtist ? (
  <Lock className="w-6 h-6 text-amber-500" />
) : (
  <Plus className="w-7 h-7 text-gray-400" />
)}
```

## User Experience Flows

### Unauthenticated Collector

1. **Opens artwork page** → Sees full content immediately
2. **Views** artwork images, artist info, all content blocks
3. **Reads** community stories from other collectors
4. **Clicks "Add Story"** → Lock icon with amber styling appears
5. **Clicks locked button** → Authentication modal opens
6. **Prompted to** scan NFC tag or enter code manually

### Authenticated Collector

1. **Opens artwork page** → Sees full content
2. **Sees** green "Authenticated" badge at top
3. **Can add stories** → "Add Story" button with plus icon
4. **Can interact** with all features (voice notes, photos, videos)
5. **Posts appear** in shared timeline for all to see

### Visual Indicators

- **Authenticated**: Green badge with checkmark
- **Locked interaction**: Amber lock icon with "Locked" label
- **Unlockable content exists**: Shows unlock CTA at bottom
- **No unlockable content**: No authentication barriers shown

## Database Schema

No changes required. Uses existing fields:
- `nfc_claimed_at` - Determines authentication status
- `product_benefits` - Content blocks configuration

## API Endpoints

### GET `/api/collector/artwork/[id]`

**Response includes**:
```typescript
{
  artwork: { ... },
  artist: { ... },
  contentBlocks: ContentBlock[], // Always included
  lockedContentPreview: ContentPreview[], // Only if !authenticated && hasContent
  isAuthenticated: boolean,
  canInteract: boolean, // NEW - Permission to post/interact
  specialChips: SpecialChip[],
  discoveryData: { ... }
}
```

## Testing Requirements

### Manual Testing Checklist

- [ ] View artwork without authentication - all content visible
- [ ] View artwork without authentication - see lock icon on "Add Story"
- [ ] Click locked "Add Story" button - authentication modal appears
- [ ] View artwork WITH authentication - see "Authenticated" badge
- [ ] Post story with authentication - successfully creates post
- [ ] View artwork with NO content blocks - no auth barriers
- [ ] View artwork with content blocks - content always visible
- [ ] Test on mobile - locked interactions clearly indicated

### Edge Cases

1. **No content blocks** - Page shows basic artwork info, no lock UI
2. **Mixed auth states** - Non-owners can view but not interact
3. **Series content** - Fallback to series-level blocks works correctly

## Known Limitations

1. **Partial locking not supported** - Cannot have some blocks public and others locked (all or nothing)
2. **Story posting API** - Still requires backend authentication check (security layer)
3. **Voice recorder** - Uses same sheet, inherits owner check

## Future Enhancements

1. **Tiered content** - Allow marking specific blocks as "public" vs "locked"
2. **Contextual prompts** - Show authentication prompt only on first interaction attempt
3. **Social proof** - Show "X collectors have shared stories" to encourage auth
4. **Preview mode** - Allow limited story viewing before authentication

## Related Files

### Implementation
- `app/collector/artwork/[id]/page.tsx` - Main artwork page
- `app/api/collector/artwork/[id]/route.ts` - API endpoint
- `app/collector/artwork/[id]/components/story/SharedStoryTimeline.tsx` - Story timeline
- `app/collector/artwork/[id]/components/story/StoryCircles.tsx` - Story circles with lock
- `lib/story/types.ts` - TypeScript interfaces

### Components Used
- `NFCAuthSheet` - Authentication modal
- `LockedContentPreview` - Preview of locked content (conditional)
- `SharedStoryTimeline` - Story viewer with interaction control
- `StoryCircles` - Story carousel with lock indicator

## Performance Considerations

- **No impact** - Content blocks always loaded (same as before for authenticated users)
- **Reduced friction** - Non-authenticated users see content immediately
- **Conversion potential** - Users more likely to authenticate after seeing full value

## Security Considerations

1. **Read-only by default** - Viewing content is safe
2. **Write operations protected** - API still validates authentication for POST operations
3. **NFC tag security** - Physical possession required for authentication
4. **Session management** - Backend validates sessions for all mutations

## Success Metrics

- Increased page views from non-authenticated users
- Higher authentication conversion rate
- More story posts from collectors
- Reduced bounce rate on artwork pages

## Support & Troubleshooting

### Issue: Lock icon not showing
**Solution**: Check that `canInteract` is false and `isOwner` prop is correctly passed

### Issue: Content not visible without auth
**Solution**: Verify API returns `contentBlocks` regardless of auth status

### Issue: Authentication modal not appearing
**Solution**: Check `onAuthRequired` callback is wired through props chain

## Commit Log

See: `docs/COMMIT_LOGS/conditional-artwork-access-2026-02-01.md`
