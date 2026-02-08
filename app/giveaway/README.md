# Giveaway Roulette Wheel

A standalone web application for running Instagram-based giveaways with animated roulette wheel selection, weighted entry system, and database persistence.

## Overview

The Giveaway Roulette Wheel allows admins or moderators to:

1. **Parse Instagram Comments**: Paste raw Instagram comments in the format of @tagger @tagged1 @tagged2
2. **Create Entries**: Each tag creates one entry on the wheel (tagging 3 people = 3 entries)
3. **Spin the Wheel**: Animated GSAP-powered roulette wheel with smooth 60fps rotation
4. **Select Winners**: Both the tagger and the tagged person win the prize
5. **Save Results**: All giveaway data is stored in Supabase for record-keeping

## Features

### Comment Parsing
- Extracts @mentions from Instagram comments using regex
- Validates tagger/tagged pairs
- Handles multiple tags per comment
- Prevents self-tags (same user tagging themselves)
- Provides detailed error reporting

### Weighted Entry System
- Each tag = one entry on the wheel
- If user A tags users B, C, D = 3 separate entries for user A
- All entries have equal weight for fair random selection
- Visual representation on the wheel shows all entries

### Animated Roulette Wheel
- GSAP-powered smooth animations
- Circular wheel with entry names displayed
- Pointer indicator at the top
- Random deceleration for fairness
- 4-second spin animation with Power4 easing
- Yellow pointer indicator

### Winner Display
- Modal announcement with both winners
- Trophy emoji and celebration text
- Separate display of tagger (TAG GIVER) and tagged (TAG RECEIVER)
- Confetti celebration effect
- Beautiful blue/purple gradient styling

### Database Storage
- Supabase PostgreSQL persistence
- Stores giveaway name, entries, and winner data
- Tracks giveaway completion timestamp
- Supports future analytics and history

## File Structure

```
app/
  giveaway/
    page.tsx                          # Main page component with 3-step flow

api/
  giveaway/
    parse/
      route.ts                        # Parse comments → entries
    save/
      route.ts                        # Save results to Supabase
    history/
      route.ts                        # Fetch past giveaways

components/
  giveaway/
    RouletteWheel.tsx                 # GSAP-animated wheel component
    WinnerDisplay.tsx                 # Winner announcement modal with confetti
    EntryList.tsx                     # Display parsed entries with statistics

lib/
  giveaway/
    types.ts                          # TypeScript interfaces
    comment-parser.ts                 # Instagram comment parsing logic
```

## Implementation Details

### Architecture

The giveaway system follows a three-step workflow:

1. **Step 1: Parse Comments**
   - User enters giveaway name
   - Pastes Instagram comments
   - System parses @mentions and creates entries
   - Validates entries and shows any errors

2. **Step 2: Spin the Wheel**
   - Displays all parsed entries
   - Shows entry statistics (total, unique taggers, unique tagged)
   - User clicks "Spin to Win!"
   - Wheel animates and selects a random entry

3. **Step 3: View Results**
   - Winner announcement page
   - Shows both tagger and tagged person
   - Displays confetti celebration
   - Results saved to database

### Comment Parsing Algorithm

```
For each comment line:
  1. Extract all @mentions using USERNAME_REGEX
  2. First @mention = tagger (commenter)
  3. Remaining @mentions = tagged users
  4. For each tagged user:
     - Create ParsedTag entry (tagger, tagged, commentIndex)
     - Skip if self-tag (tagger === tagged)
  5. Return ParsedEntry with all tags and errors
```

### Winner Selection

The RouletteWheel component:
1. Calculates angle per segment (360° / number of entries)
2. Generates random winner using weighted selection
3. Calculates target angle for winner segment
4. Animates wheel to land on winner with multiple rotations
5. Applies Power4.easeOut for natural deceleration

### Database Schema

```sql
CREATE TABLE giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_name TEXT NOT NULL,
  entry_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  winner_data JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The JSONB fields store:
- **entry_data**: { tags: ParsedTag[], totalEntries: number, wheelEntries: WheelEntry[] }
- **winner_data**: { tagger: string, tagged: string, wheelEntryId: string, selectedAt: ISO8601 }

## API Routes

### POST /api/giveaway/parse
Parse Instagram comments and create wheel entries.

**Request:**
```json
{
  "comments": "@alice @bob @charlie\n@john @jane"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [ /* parsed entries */ ],
    "totalEntries": 3,
    "errors": []
  },
  "wheelEntries": [ /* WheelEntry objects */ ]
}
```

### POST /api/giveaway/save
Save giveaway results to database.

**Request:**
```json
{
  "giveawayName": "Limited Edition Vinyl",
  "entryData": { /* parsed entry data */ },
  "winnerData": { "tagger": "@john", "tagged": "@jane", ... }
}
```

**Response:**
```json
{
  "success": true,
  "giveawayId": "uuid-here",
  "message": "Giveaway results saved successfully."
}
```

### GET /api/giveaway/history
Fetch past giveaway results.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [ /* GiveawayRecord objects */ ],
  "total": 25,
  "page": 1,
  "pageSize": 10
}
```

## Styling & Branding

The giveaway uses Street Collector's Impact theme design system:

- **Primary Color**: `#2c4bce` (blue)
- **Secondary Color**: `#f0c417` (yellow)
- **Dark Background**: `#390000`
- **Accent Text**: `#ffba94`
- **Success Green**: `#00a341`

Components use:
- Polaris design tokens via CSS variables
- Tailwind CSS for responsive layout
- GSAP for smooth animations
- React Confetti for celebration effects

## Testing

### Manual Testing Steps

1. **Parse Comments**
   - Enter giveaway name: "Test Giveaway"
   - Paste comments: `@alice @bob\n@john @jane @jack`
   - Verify 3 entries are parsed
   - Verify entry list shows all entries correctly

2. **Spin Wheel**
   - Wheel should display all entries around circumference
   - Yellow pointer should be at top
   - Spin button should be active
   - No errors in browser console

3. **Select Winner**
   - Click "Spin to Win!"
   - Wheel should animate smoothly for ~4 seconds
   - Button should show "Spinning..." during animation
   - After animation, winner modal should appear
   - Both tagger and tagged should be displayed

4. **Save Results** (requires migration)
   - Results page should save to database
   - History API should return saved giveaways

### Unit Tests

The comment parser includes helper functions for testing:
```typescript
// Parse and validate comments
const parsed = parseInstagramComments(commentText);

// Create wheel entries
const entries = createWheelEntries(parsed.tags);

// Get statistics
const stats = getParseStats(parsed);
```

## Known Limitations

1. **Instagram API**: Currently only supports copy-pasted comments (no direct Instagram integration)
2. **Comment Format**: Requires @username format; other mention formats won't be parsed
3. **Self-tags**: Automatically skipped; same user can't tag themselves
4. **Wheel Size**: Tested with up to 50 entries; performance may degrade beyond that
5. **Mobile**: Touch interactions on mobile devices may need optimization

## Future Enhancements

- [ ] Direct Instagram API integration
- [ ] Email notifications to winners
- [ ] Export winner list as CSV/PDF
- [ ] Social media share buttons
- [ ] Analytics dashboard
- [ ] Multiple giveaway rounds in one session
- [ ] Custom branding/colors per giveaway
- [ ] QR code generation for winners
- [ ] Integration with Shopify for prize fulfillment
- [ ] Recurring giveaway templates

## Setup & Installation

### Prerequisites
- Next.js 15+
- Supabase project
- Node.js 18+

### Database Migration
Apply the migration to create the `giveaway_entries` table:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run the SQL in your Supabase project:
supabase/migrations/20260208000000_create_giveaway_entries.sql
```

### Environment Variables
No additional environment variables needed; uses existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Access the Feature
Navigate to: `http://localhost:3000/giveaway` (dev) or `https://app.thestreetcollector.com/giveaway` (production)

## Performance Considerations

- **Wheel Animation**: 60fps GSAP animation with GPU acceleration (will-change: transform)
- **Entry Parsing**: O(n) regex matching on comment lines
- **Random Selection**: O(n) weighted selection algorithm
- **Database**: Indexes on status and created_at for fast queries
- **Bundle Size**: Adds ~15KB gzipped (GSAP, React Confetti already in project)

## Security & Validation

- Input validation on comment text
- Sanitization of usernames (alphanumeric, dots, underscores)
- RLS policies on giveaway_entries table
- Server-side validation on all API routes
- No sensitive data stored in entry_data

## Troubleshooting

### Wheel Not Animating
- Check browser console for GSAP errors
- Verify `useGSAP` hook from `@gsap/react` is properly imported
- Check window isn't in reduced motion mode

### Winners Not Showing
- Verify entry parsing succeeded (check console network request)
- Ensure at least 2 valid entries (tagger + tagged)
- Check for self-tag errors in parse warnings

### Database Save Failed
- Run migration: `supabase migration up`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project connection

## Implementation References

- [GSAP Animations](lib/animations/gsap-config.ts)
- [Design System](lib/design-system/tokens.ts)
- [Polaris Components](components/polaris/)
- [React Confetti](https://www.npmjs.com/package/react-confetti)

## Version History

- **v1.0.0** (2026-02-08): Initial release
  - Instagram comment parsing
  - Animated roulette wheel
  - Winner selection
  - Database persistence
  - Beautiful UI with Street Collector branding

