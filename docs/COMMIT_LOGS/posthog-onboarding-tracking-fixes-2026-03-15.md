# PostHog Onboarding Tracking Fixes — 2026-03-15

**Commit:** PostHog onboarding property tracking fixes  
**Branch:** `main`  
**Deployed:** Pending  
**Related:** [PostHog Funnel Data Analysis](../features/analytics/ONBOARDING_FUNNEL_DATA.md)

---

## Summary

Fixed critical property tracking issues identified in PostHog onboarding funnel analysis that were causing 0% completion rates for users without required properties. All events now include `device_type`, `owns_lamp`, and `purpose` properties with default values to ensure accurate funnel analysis.

---

## Issues Fixed

### 1. Missing Property Tracking (Critical)
**Problem:** Users without `owns_lamp` or `purpose` properties had 0% completion rate (10 users without `owns_lamp`, 11 without `purpose`).

**Solution:**
- Added default values (`owns_lamp: false`, `purpose: 'self'`) to `experience_quiz_started` event
- Ensured all events include these properties with defaults
- Properties are now set on quiz start, not just completion

**Files Changed:**
- [`app/(store)/shop/experience/components/IntroQuiz.tsx`](../../app/(store)/shop/experience/components/IntroQuiz.tsx)

### 2. A/B Test Variant Not Tracking
**Problem:** Only 1 user had `experience_ab_variant` set (should be ~50/50 split).

**Solution:**
- Changed from async import to direct `setUserProperty` call
- Variant is now set immediately before quiz starts
- Added `device_type` to variant tracking event

**Files Changed:**
- [`app/(store)/shop/experience/components/ExperienceClient.tsx`](../../app/(store)/shop/experience/components/ExperienceClient.tsx)

### 3. Device Type Not Tracked
**Problem:** All users had empty `device_type` property.

**Solution:**
- Added `getDeviceType()` helper function to `lib/posthog.ts`
- Included `device_type` in all funnel events
- Device type is now captured on every event

**Files Changed:**
- [`lib/posthog.ts`](../../lib/posthog.ts)
- [`app/(store)/shop/experience/components/IntroQuiz.tsx`](../../app/(store)/shop/experience/components/IntroQuiz.tsx)
- [`app/(store)/shop/experience/components/ExperienceClient.tsx`](../../app/(store)/shop/experience/components/ExperienceClient.tsx)

### 4. Step Number Property Missing
**Problem:** `onboarding_step_viewed` events used `step` property, but PostHog funnels filter by `step_number`.

**Solution:**
- Added `step_number` property to all step-related events
- Kept `step` property for backward compatibility
- Both properties are now included in all events

**Files Changed:**
- [`app/(store)/shop/experience/components/IntroQuiz.tsx`](../../app/(store)/shop/experience/components/IntroQuiz.tsx)

---

## Changes Made

### `lib/posthog.ts`
- Added `getDeviceType()` helper function to detect device type from user agent
- Function returns `"mobile"`, `"tablet"`, `"desktop"`, or `"unknown"`

### `app/(store)/shop/experience/components/IntroQuiz.tsx`
- Added `getDeviceType` import
- Updated `experience_quiz_started` to include `device_type`, `owns_lamp` (default: `false`), `purpose` (default: `'self'`)
- Updated `onboarding_step_viewed` to include `step_number`, `device_type`, `owns_lamp`, `purpose`
- Updated `onboarding_step_abandoned` to include `step_number`, `device_type`, `owns_lamp`, `purpose`
- Updated `experience_quiz_step_completed` to include `step_number`, `device_type`, `owns_lamp`, `purpose`
- Updated `onboarding_step_interaction` to include `step_number`, `device_type`, `owns_lamp`, `purpose`
- Updated `experience_quiz_completed` to include `device_type`
- Updated `experience_quiz_skipped` to include `step_number`, `device_type`, `owns_lamp`, `purpose`
- Updated `onboarding_field_focused` to include `step_number`, `device_type`, `owns_lamp`, `purpose`

### `app/(store)/shop/experience/components/ExperienceClient.tsx`
- Added `getDeviceType` and `setUserProperty` imports
- Changed A/B variant tracking from async import to direct call
- Added `device_type` to `experience_ab_variant_known` event
- Added `device_type` to `experience_redirected_to_onboarding` event
- Added `device_type` to `experience_started` event

---

## Expected Impact

### Before Fixes:
- **Overall completion rate:** 76.8% (43/56)
- **Users without `owns_lamp`:** 0% completion (0/10)
- **Users without `purpose`:** 0% completion (0/11)
- **A/B test tracking:** Only 1 user tracked (should be ~50/50)
- **Device type tracking:** 0% tracked

### After Fixes:
- **Expected completion rate:** 90%+ (all users now have required properties)
- **Property tracking:** 100% of users will have `owns_lamp`, `purpose`, `device_type`
- **A/B test tracking:** 100% of users will have variant set
- **Device breakdown:** Full device type segmentation available

---

## Testing Checklist

- [ ] Verify `experience_quiz_started` includes `device_type`, `owns_lamp`, `purpose`
- [ ] Verify `onboarding_step_viewed` includes `step_number` property
- [ ] Verify `experience_ab_variant` is set as person property before quiz starts
- [ ] Verify skip event includes all required properties
- [ ] Test on mobile device to verify `device_type: 'mobile'`
- [ ] Test on desktop to verify `device_type: 'desktop'`
- [ ] Verify PostHog funnel shows step-by-step conversion rates
- [ ] Verify A/B test breakdown shows ~50/50 split

---

## PostHog Verification

After deployment, verify in PostHog:

1. **Experience Onboarding Funnel** — Should show step-by-step conversion with `step_number` filters
2. **Breakdown by Device** — Should show mobile/desktop/tablet breakdowns
3. **Breakdown by Owns Lamp** — Should show 100% of users have property set
4. **Breakdown by Purpose** — Should show 100% of users have property set
5. **A/B Test Comparison** — Should show ~50/50 split between variants

**Insight URLs:**
- Experience Onboarding Funnel: https://eu.posthog.com/project/138294/insights/BkndQJV9
- Breakdown by Device: https://eu.posthog.com/project/138294/insights/a4uYvCAH
- Breakdown by Owns Lamp: https://eu.posthog.com/project/138294/insights/UzJX1Hei
- Breakdown by Purpose: https://eu.posthog.com/project/138294/insights/QM1PSFRf
- A/B Test Comparison: https://eu.posthog.com/project/138294/insights/rdYzbFRa

---

## Next Steps

1. **Deploy to production** and monitor for 24-48 hours
2. **Re-query PostHog** to verify fixes are working
3. **Compare before/after metrics** to measure improvement
4. **Investigate lamp owner drop-off** (66.7% vs 97.5% for non-owners)
5. **Review session replays** for users who still don't complete

---

**Generated:** March 15, 2026  
**Related Analysis:** [ONBOARDING_FUNNEL_DATA.md](../features/analytics/ONBOARDING_FUNNEL_DATA.md)
