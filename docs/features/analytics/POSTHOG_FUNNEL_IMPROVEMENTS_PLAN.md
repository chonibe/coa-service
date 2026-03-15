# PostHog Funnel & Onboarding Improvement Plan

## Overview
This plan outlines improvements to funnel analysis and onboarding optimization using PostHog features and MCP tools. The goal is to identify drop-off points, optimize conversion rates, and improve user experience through data-driven insights.

## Current State
- PostHog initialized with session replay, heatmaps, autocapture, dead clicks, rageclick
- Basic funnel events tracked: `experience_quiz_started`, `experience_quiz_completed`, `experience_started`, `collector_onboarding_started`, etc.
- E-commerce events mirrored: `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`
- A/B test exists but uses cookie-based assignment (not PostHog feature flags)
- PostHog MCP available but underutilized for insights/dashboards

## Implementation Plan

### Phase 1: Enhanced Event Tracking

#### 1.1 Add Micro-Interaction Events
**File:** `lib/posthog.ts`
- Add new event types for granular tracking:
  - `onboarding_step_viewed` - When user views a step (with step number, time on previous step)
  - `onboarding_step_interaction` - Button clicks, form field focus within steps
  - `onboarding_step_abandoned` - When user leaves a step without completing
  - `onboarding_field_focused` - Form field interactions
  - `onboarding_field_error` - Validation errors
  - `checkout_step_viewed` - Each checkout step (address, payment, review)
  - `checkout_step_abandoned` - Drop-off at specific checkout steps
  - `experience_artwork_previewed` - When user previews artwork in configurator
  - `experience_artwork_preview_time` - Time spent previewing artwork
  - `experience_filter_interaction` - Filter panel opens/closes, filter changes

**File:** `app/(store)/shop/experience/components/IntroQuiz.tsx`
- Add `onboarding_step_viewed` event when step mounts (with step number, previous step time)
- Add `onboarding_step_interaction` on button clicks (button type, step number)
- Add `onboarding_field_focused` on input focus (field name, step number)
- Track time spent on each step before navigation
- Add `onboarding_step_abandoned` if user navigates away without completing

**File:** `app/collector/components/onboarding-wizard.tsx`
- Add same micro-interaction events for collector onboarding
- Track form field interactions (first_name, last_name, bio, phone, avatar_url)
- Track validation errors with `onboarding_field_error`
- Track step completion time vs. abandonment

**File:** `app/(store)/shop/experience/components/Configurator.tsx`
- Add `experience_artwork_previewed` when artwork is selected/previewed
- Track `experience_artwork_preview_time` (time between preview start and next action)
- Add `experience_filter_interaction` when filter panel opens/closes

**File:** `components/shop/checkout/CheckoutLayout.tsx`
- Add `checkout_step_viewed` when address/payment/review sections are viewed
- Add `checkout_step_abandoned` when user leaves checkout without completing
- Track form field interactions in checkout

#### 1.2 Add Session Context Events
**File:** `lib/posthog.ts`
- Add helper function `captureSessionContext()` to attach session metadata:
  - `session_start_time` - When session started
  - `pages_viewed_count` - Number of pages viewed in session
  - `time_on_site` - Total time on site
  - `referrer` - Where user came from
  - `device_type` - Mobile/desktop/tablet
  - `browser` - Browser type
  - `is_returning_user` - Boolean based on previous sessions

**File:** `app/providers.tsx`
- Call `captureSessionContext()` on PostHog init
- Update session context on each pageview

### Phase 2: PostHog Feature Flags Implementation

#### 2.1 Create Feature Flag Hook
**File:** `hooks/use-posthog-feature-flag.ts` (new)
- Create custom hook `usePostHogFeatureFlag(flagKey: string, defaultValue: boolean)`
- Returns `{ isEnabled: boolean, isLoading: boolean }`
- Handles PostHog feature flag evaluation
- Caches flag value in component state

#### 2.2 Migrate A/B Test to Feature Flags
**File:** `app/(store)/shop/experience/components/ExperienceClient.tsx`
- Replace cookie-based A/B test with PostHog feature flag `experience_onboarding_variant`
- Use `usePostHogFeatureFlag('experience_onboarding_variant', 'onboarding')`
- Track feature flag exposure: `captureFunnelEvent('feature_flag_exposed', { flag: 'experience_onboarding_variant', variant })`
- Remove cookie-based logic (`getABVariantFromCookie`, `setABVariantCookie`)

#### 2.3 Create Additional Feature Flags
**File:** `app/(store)/shop/experience/components/IntroQuiz.tsx`
- Add feature flag `onboarding_progressive_disclosure` - Test showing fewer steps initially
- Add feature flag `onboarding_skip_enabled` - Control skip button visibility
- Track flag exposure and variant for each user

**File:** `app/collector/components/onboarding-wizard.tsx`
- Add feature flag `collector_onboarding_auto_save` - Test auto-save vs manual save
- Add feature flag `collector_onboarding_skip_allowed` - Control skip functionality

### Phase 3: PostHog MCP Insights & Dashboards

#### 3.1 Create Comprehensive Funnel Insights
**MCP Tool:** `insight-create-from-query` or `insight-create-funnel`

**Funnel 1: Complete Purchase Funnel**
- Steps:
  1. `$pageview` (Landing)
  2. `experience_quiz_started` OR `view_item` (Engagement)
  3. `experience_started` OR `view_item` (Product Discovery)
  4. `add_to_cart` (Add to Cart)
  5. `begin_checkout` (Checkout Started)
  6. `add_payment_info` (Payment Info Added)
  7. `purchase` (Purchase Complete)
- Breakdown by: `owns_lamp`, `purpose`, `item_list_name`, `device_type`
- Conversion window: 7 days
- Name: "Complete Purchase Funnel"

**Funnel 2: Experience Onboarding Funnel**
- Steps:
  1. `experience_quiz_started`
  2. `onboarding_step_viewed` (step 1)
  3. `onboarding_step_viewed` (step 2)
  4. `onboarding_step_viewed` (step 3)
  5. `experience_quiz_completed`
  6. `experience_started`
- Breakdown by: `owns_lamp`, `purpose`, `device_type`
- Conversion window: 1 hour
- Name: "Experience Onboarding Funnel"

**Funnel 3: Collector Onboarding Funnel**
- Steps:
  1. `collector_onboarding_started`
  2. `onboarding_step_viewed` (step 0 - Welcome)
  3. `onboarding_step_viewed` (step 1 - Profile Setup)
  4. `onboarding_step_viewed` (step 2 - InkOGatchi)
  5. `onboarding_step_viewed` (step 3 - Discovery)
  6. `collector_onboarding_completed`
- Breakdown by: `device_type`, `referrer`
- Conversion window: 1 day
- Name: "Collector Onboarding Funnel"

**Funnel 4: Checkout Funnel**
- Steps:
  1. `begin_checkout`
  2. `checkout_step_viewed` (address)
  3. `checkout_step_viewed` (payment)
  4. `add_payment_info`
  5. `purchase`
- Breakdown by: `payment_type`, `device_type`, `country`
- Conversion window: 1 hour
- Name: "Checkout Completion Funnel"

**Funnel 5: Mobile vs Desktop Purchase Funnel**
- Steps: Same as Complete Purchase Funnel
- Breakdown by: `device_type` (mobile, desktop, tablet)
- Conversion window: 7 days
- Name: "Mobile vs Desktop Purchase Funnel"
- Purpose: Compare conversion rates across device types

**Funnel 6: New vs Returning User Funnel**
- Steps: Same as Complete Purchase Funnel
- Breakdown by: `is_returning_user` (true/false)
- Conversion window: 7 days
- Name: "New vs Returning User Funnel"
- Purpose: Compare conversion rates for new vs returning users

**Funnel 7: Traffic Source Funnel**
- Steps: Same as Complete Purchase Funnel
- Breakdown by: `$initial_referrer`, `utm_source`, `utm_medium`, `utm_campaign`
- Conversion window: 7 days
- Name: "Traffic Source Purchase Funnel"
- Purpose: Identify highest-converting traffic sources

**Funnel 8: Artist-Specific Purchase Funnel**
- Steps:
  1. `view_item` (where `item_brand` = specific artist)
  2. `add_to_cart` (same artist)
  3. `begin_checkout`
  4. `purchase`
- Breakdown by: `item_brand` (artist name)
- Conversion window: 7 days
- Name: "Artist-Specific Purchase Funnel"
- Purpose: Compare conversion rates by artist

**Funnel 9: Experience vs Shop Purchase Funnel**
- Steps:
  1. `$pageview` (where `$pathname` contains `/shop/experience` OR `/shop/products`)
  2. `view_item`
  3. `add_to_cart`
  4. `begin_checkout`
  5. `purchase`
- Breakdown by: `item_list_name` (experience vs products vs home vs artist vs pdp)
- Conversion window: 7 days
- Name: "Experience vs Shop Purchase Funnel"
- Purpose: Compare conversion rates between experience configurator and traditional shop

**Funnel 10: Gift vs Self Purchase Funnel**
- Steps: Same as Complete Purchase Funnel
- Breakdown by: `purpose` (gift vs self)
- Conversion window: 7 days
- Name: "Gift vs Self Purchase Funnel"
- Purpose: Compare conversion rates for gift purchases vs personal purchases

#### 3.2 Create Trends Insights
**MCP Tool:** `insight-create-from-query`

**Trend 1: Onboarding Drop-off Rates**
- Metric: Count of `onboarding_step_abandoned`
- Breakdown by: `step_number`, `step_name`
- Group by: Day
- Name: "Onboarding Step Abandonment"

**Trend 2: Time to Complete Onboarding**
- Metric: Average time between `experience_quiz_started` and `experience_quiz_completed`
- Breakdown by: `owns_lamp`, `purpose`
- Group by: Day
- Name: "Onboarding Completion Time"

**Trend 3: Checkout Abandonment**
- Metric: Count of `checkout_step_abandoned`
- Breakdown by: `step_name`
- Group by: Day
- Name: "Checkout Step Abandonment"

**Trend 4: Experience Engagement**
- Metric: Average `experience_artwork_preview_time`
- Breakdown by: `item_list_name`
- Group by: Day
- Name: "Artwork Preview Engagement"

**Trend 5: Conversion Rate Over Time**
- Metric: Percentage of users who complete `purchase` after `begin_checkout`
- Breakdown by: `device_type`, `country`
- Group by: Day
- Name: "Conversion Rate Over Time"
- Purpose: Track conversion rate trends and identify seasonal patterns

**Trend 6: Average Order Value Trend**
- Metric: Average `value` from `purchase` events
- Breakdown by: `item_list_name`, `purpose`
- Group by: Day
- Name: "Average Order Value Trend"
- Purpose: Track AOV trends and identify upsell opportunities

**Trend 7: Cart Abandonment Rate**
- Metric: Percentage of users who `add_to_cart` but don't `begin_checkout`
- Breakdown by: `device_type`, `item_list_name`
- Group by: Day
- Name: "Cart Abandonment Rate"
- Purpose: Track cart abandonment trends

**Trend 8: Onboarding Completion Rate**
- Metric: Percentage of users who complete `experience_quiz_completed` after `experience_quiz_started`
- Breakdown by: `owns_lamp`, `purpose`, `device_type`
- Group by: Day
- Name: "Onboarding Completion Rate"
- Purpose: Track onboarding success rates over time

**Trend 9: User Engagement Score**
- Metric: Composite score based on: `view_item` count, `add_to_cart` count, `experience_artwork_preview_time`, session duration
- Breakdown by: `device_type`, `is_returning_user`
- Group by: Day
- Name: "User Engagement Score"
- Purpose: Track overall user engagement trends

**Trend 10: Error Recovery Rate**
- Metric: Percentage of users who recover after `checkout_error` or `payment_error` and complete `purchase`
- Breakdown by: `error_type`
- Group by: Day
- Name: "Error Recovery Rate"
- Purpose: Track how well users recover from errors

**Trend 11: Feature Adoption Rate**
- Metric: Percentage of users who use experience configurator (`experience_started`) vs traditional shop (`view_item` on `/shop/products`)
- Breakdown by: `device_type`, `is_returning_user`
- Group by: Day
- Name: "Feature Adoption Rate"
- Purpose: Track adoption of experience configurator feature

**Trend 12: Retention Rate (Day 1, 7, 30)**
- Metric: Percentage of users who return after 1, 7, and 30 days
- Breakdown by: `device_type`, `purpose`
- Group by: Day
- Name: "User Retention Rate"
- Purpose: Track user retention at different intervals

#### 3.3 Create Paths Insights
**MCP Tool:** `insight-create-paths`

**Path 1: User Journey from Landing to Purchase**
- Start event: `$pageview` (where `$pathname` = `/shop/street-collector` or `/shop/experience`)
- End event: `purchase`
- Include: All custom events, pageviews
- Name: "Landing to Purchase Path"

**Path 2: Onboarding Completion Paths**
- Start event: `experience_quiz_started`
- End event: `experience_started`
- Include: All onboarding events, pageviews
- Name: "Onboarding Completion Paths"

**Path 3: Error Recovery Paths**
- Start event: `checkout_error` OR `payment_error`
- End event: `purchase`
- Include: All events between error and purchase
- Name: "Error Recovery Paths"
- Purpose: Understand how users recover from errors

**Path 4: Alternative Conversion Paths**
- Start event: `$pageview` (any page)
- End event: `purchase`
- Include: All events, exclude direct path through main funnel
- Name: "Alternative Conversion Paths"
- Purpose: Identify alternative paths to purchase

**Path 5: High-Value Customer Paths**
- Start event: `$pageview`
- End event: `purchase` (where `value` > $100)
- Include: All events
- Name: "High-Value Customer Paths"
- Purpose: Understand paths taken by high-value customers

**Path 6: Drop-off Recovery Paths**
- Start event: `onboarding_step_abandoned` OR `checkout_step_abandoned`
- End event: `purchase` OR `experience_started` OR `collector_onboarding_completed`
- Include: All events after abandonment
- Name: "Drop-off Recovery Paths"
- Purpose: Understand how users recover from drop-offs

**Path 7: Mobile User Journey**
- Start event: `$pageview` (where `device_type` = mobile)
- End event: `purchase`
- Include: All events
- Name: "Mobile User Journey"
- Purpose: Understand mobile user navigation patterns

**Path 8: Returning User Journey**
- Start event: `$pageview` (where `is_returning_user` = true)
- End event: `purchase`
- Include: All events
- Name: "Returning User Journey"
- Purpose: Understand how returning users navigate

#### 3.4 Create Cohorts
**MCP Tool:** `cohort-create`

**Cohort 1: Fast Onboarding Completers**
- Users who complete `experience_quiz_started` → `experience_quiz_completed` in < 60 seconds
- Name: "Fast Onboarding Completers"

**Cohort 2: Onboarding Drop-offs**
- Users who trigger `onboarding_step_abandoned` but never complete onboarding
- Name: "Onboarding Drop-offs"

**Cohort 3: High-Value Customers**
- Users who complete `purchase` with `value` > $100
- Name: "High-Value Customers"

**Cohort 4: Returning Purchasers**
- Users who complete `purchase` more than once
- Name: "Returning Purchasers"

**Cohort 5: Mobile Users**
- Users whose `device_type` = mobile for majority of sessions
- Name: "Mobile Users"
- Purpose: Segment mobile users for mobile-specific optimizations

**Cohort 6: Desktop Users**
- Users whose `device_type` = desktop for majority of sessions
- Name: "Desktop Users"
- Purpose: Segment desktop users for desktop-specific optimizations

**Cohort 7: Organic Traffic Users**
- Users who arrive via `utm_source` = organic or no UTM parameters
- Name: "Organic Traffic Users"
- Purpose: Segment organic users for SEO analysis

**Cohort 8: Paid Traffic Users**
- Users who arrive via `utm_source` = paid (Google Ads, Meta, etc.)
- Name: "Paid Traffic Users"
- Purpose: Segment paid traffic users for ROI analysis

**Cohort 9: Gift Purchasers**
- Users who complete `purchase` with `purpose` = gift
- Name: "Gift Purchasers"
- Purpose: Segment gift purchasers for gift-specific campaigns

**Cohort 10: Lamp Owners**
- Users who answer `owns_lamp` = true in onboarding
- Name: "Lamp Owners"
- Purpose: Segment existing lamp owners for upsell opportunities

**Cohort 11: New Lamp Buyers**
- Users who answer `owns_lamp` = false in onboarding but complete `purchase` with lamp product
- Name: "New Lamp Buyers"
- Purpose: Segment new lamp buyers for onboarding optimization

**Cohort 12: High Engagement Users**
- Users who trigger `experience_artwork_previewed` > 10 times in a session
- Name: "High Engagement Users"
- Purpose: Segment highly engaged users for feature testing

**Cohort 13: Quick Purchasers**
- Users who complete `purchase` within 5 minutes of first `$pageview`
- Name: "Quick Purchasers"
- Purpose: Segment quick purchasers for understanding impulse buying

**Cohort 14: Consideration Phase Users**
- Users who `add_to_cart` but don't `begin_checkout` within 24 hours
- Name: "Consideration Phase Users"
- Purpose: Segment users in consideration phase for retargeting

**Cohort 15: Multi-Artist Shoppers**
- Users who `view_item` or `add_to_cart` products from > 3 different artists
- Name: "Multi-Artist Shoppers"
- Purpose: Segment multi-artist shoppers for cross-artist recommendations

**Cohort 16: Experience Configurator Users**
- Users who trigger `experience_started` event
- Name: "Experience Configurator Users"
- Purpose: Segment users who use the experience configurator feature

**Cohort 17: Traditional Shop Users**
- Users who `view_item` on `/shop/products` but never trigger `experience_started`
- Name: "Traditional Shop Users"
- Purpose: Segment users who prefer traditional shopping experience

**Cohort 18: Collector Onboarding Completers**
- Users who complete `collector_onboarding_completed`
- Name: "Collector Onboarding Completers"
- Purpose: Segment users who complete collector onboarding

**Cohort 19: Collector Onboarding Drop-offs**
- Users who start `collector_onboarding_started` but never complete
- Name: "Collector Onboarding Drop-offs"
- Purpose: Segment users who drop off during collector onboarding

**Cohort 20: Error Encountering Users**
- Users who trigger `checkout_error` or `payment_error`
- Name: "Error Encountering Users"
- Purpose: Segment users who encounter errors for support outreach

#### 3.5 Create Enhanced Dashboard
**MCP Tool:** `dashboard-create`

**Dashboard Name:** "Funnel & Onboarding Analytics"

**Insights to Add:**
1. Complete Purchase Funnel
2. Experience Onboarding Funnel
3. Collector Onboarding Funnel
4. Checkout Completion Funnel
5. Onboarding Step Abandonment (Trend)
6. Onboarding Completion Time (Trend)
7. Checkout Step Abandonment (Trend)
8. Artwork Preview Engagement (Trend)
9. Landing to Purchase Path
10. Onboarding Completion Paths

**Layout:** 3 columns, responsive grid

#### 3.6 Create Retention & Engagement Dashboard
**MCP Tool:** `dashboard-create`

**Dashboard Name:** "Retention & Engagement Analytics"

**Insights to Add:**
1. User Retention Rate (Trend)
2. Feature Adoption Rate (Trend)
3. User Engagement Score (Trend)
4. Returning User Journey (Path)
5. Mobile User Journey (Path)
6. High-Value Customer Paths (Path)
7. Mobile Users (Cohort analysis)
8. Desktop Users (Cohort analysis)
9. High Engagement Users (Cohort analysis)
10. Experience Configurator Users (Cohort analysis)

**Layout:** 3 columns, responsive grid

#### 3.7 Create Conversion Optimization Dashboard
**MCP Tool:** `dashboard-create`

**Dashboard Name:** "Conversion Optimization Analytics"

**Insights to Add:**
1. Mobile vs Desktop Purchase Funnel
2. New vs Returning User Funnel
3. Traffic Source Purchase Funnel
4. Experience vs Shop Purchase Funnel
5. Gift vs Self Purchase Funnel
6. Conversion Rate Over Time (Trend)
7. Average Order Value Trend
8. Cart Abandonment Rate (Trend)
9. Error Recovery Rate (Trend)
10. Error Recovery Paths (Path)
11. Drop-off Recovery Paths (Path)
12. Alternative Conversion Paths (Path)

**Layout:** 3 columns, responsive grid

#### 3.8 Create Business Intelligence Dashboard
**MCP Tool:** `dashboard-create`

**Dashboard Name:** "Business Intelligence Analytics"

**Insights to Add:**
1. Artist-Specific Purchase Funnel
2. Average Order Value Trend
3. High-Value Customers (Cohort analysis)
4. Quick Purchasers (Cohort analysis)
5. Multi-Artist Shoppers (Cohort analysis)
6. High-Value Customer Paths (Path)
7. Gift Purchasers (Cohort analysis)
8. Lamp Owners (Cohort analysis)
9. New Lamp Buyers (Cohort analysis)
10. Consideration Phase Users (Cohort analysis)

**Layout:** 3 columns, responsive grid

### Phase 4: Session Replay Analysis

#### 4.1 Tag Sessions for Analysis
**File:** `lib/posthog.ts`
- Add helper `tagSessionForReplay(tag: string)` to tag current session
- Use when critical events occur:
  - `onboarding_step_abandoned` → Tag: "onboarding-dropoff"
  - `checkout_step_abandoned` → Tag: "checkout-dropoff"
  - `checkout_error` → Tag: "checkout-error"
  - `payment_error` → Tag: "payment-error"

**File:** `app/(store)/shop/experience/components/IntroQuiz.tsx`
- Call `tagSessionForReplay('onboarding-dropoff')` when step is abandoned

**File:** `components/shop/checkout/CheckoutLayout.tsx`
- Call `tagSessionForReplay('checkout-dropoff')` when checkout is abandoned
- Call `tagSessionForReplay('checkout-error')` on checkout errors

#### 4.2 Session Replay Configuration
**File:** `app/providers.tsx`
- Ensure session recording is enabled (already done)
- Add session recording mask for sensitive fields (email, credit card)
- Configure minimum session duration (30 seconds) before recording

### Phase 5: Heatmap Configuration

#### 5.1 Enable Heatmaps for Key Pages
**File:** `app/providers.tsx`
- Heatmaps already enabled via `enable_heatmaps: withRecording`
- Ensure heatmaps are enabled for:
  - `/shop/experience/onboarding/*` (all onboarding steps)
  - `/shop/cart` (cart page)
  - `/collector/welcome` (collector onboarding)

#### 5.2 Heatmap Analysis Setup
- Use PostHog UI to create heatmaps for:
  - Experience onboarding step 1 (button clicks)
  - Experience onboarding step 2 (button clicks)
  - Experience onboarding step 3 (form interactions)
  - Checkout address form
  - Checkout payment form

### Phase 6: Real-Time Alerts

#### 6.1 Create Alert Configuration
**MCP Tool:** `alert-create` (if available) or manual setup in PostHog UI

**Alert 1: Onboarding Drop-off Spike**
- Trigger when: `onboarding_step_abandoned` count increases by >50% compared to previous 7-day average
- Notification: Email/Slack
- Name: "Onboarding Drop-off Alert"

**Alert 2: Checkout Abandonment Spike**
- Trigger when: `checkout_step_abandoned` count increases by >30% compared to previous 7-day average
- Notification: Email/Slack
- Name: "Checkout Abandonment Alert"

**Alert 3: Conversion Rate Drop**
- Trigger when: Purchase funnel conversion rate drops by >20% compared to previous 7-day average
- Notification: Email/Slack
- Name: "Conversion Rate Alert"

**Alert 4: Error Rate Increase**
- Trigger when: `checkout_error` or `payment_error` count increases by >100% compared to previous 7-day average
- Notification: Email/Slack
- Name: "Error Rate Alert"

### Phase 7: Enhanced User Properties

#### 7.1 Track User Properties
**File:** `lib/posthog.ts`
- Add helper `setUserProperty(key: string, value: string | number | boolean)`
- Set properties on key events:
  - `onboarding_completed_at` - Timestamp when onboarding completed
  - `onboarding_time_seconds` - Time taken to complete onboarding
  - `first_purchase_at` - Timestamp of first purchase
  - `total_purchases` - Count of purchases
  - `total_spent` - Total amount spent
  - `favorite_artist` - Most purchased artist
  - `preferred_device` - Most used device type

**File:** `app/(store)/shop/experience/components/ExperienceOnboardingClient.tsx`
- Set `onboarding_completed_at` and `onboarding_time_seconds` on quiz completion

**File:** `app/track/[token]/page.tsx`
- Set `first_purchase_at`, `total_purchases`, `total_spent` on purchase

### Phase 8: Documentation & Testing

#### 8.1 Update Documentation
**File:** `docs/features/analytics/EVENTS_MAP.md`
- Add new micro-interaction events to event map
- Document feature flags usage
- Document PostHog MCP insights

**File:** `docs/features/analytics/README.md`
- Add section on feature flags
- Add section on PostHog MCP insights
- Add section on session replay analysis
- Add section on heatmaps
- Add section on alerts

#### 8.2 Testing Checklist
- [ ] Verify all new events fire correctly
- [ ] Verify feature flags work as expected
- [ ] Verify PostHog MCP insights are created
- [ ] Verify session replay tags work
- [ ] Verify heatmaps capture interactions
- [ ] Verify alerts trigger correctly
- [ ] Test on mobile and desktop
- [ ] Verify user properties are set correctly

## Success Criteria

1. **Funnel Visibility**: Complete visibility into drop-off points at each step across 10 different funnel analyses
2. **Feature Flags**: A/B tests running via PostHog feature flags (not cookies)
3. **Session Replay**: Tagged sessions for easy analysis of drop-offs
4. **Heatmaps**: Visual heatmaps showing user interaction patterns
5. **Alerts**: Real-time alerts for funnel issues
6. **Cohorts**: 20 user cohorts for segmentation and personalized experiences
7. **Paths**: 8 path analyses for understanding user navigation patterns
8. **Trends**: 12 trend insights for tracking metrics over time
9. **Dashboards**: 4 comprehensive dashboards (Funnel & Onboarding, Retention & Engagement, Conversion Optimization, Business Intelligence)
10. **Documentation**: Complete documentation of all tracking and insights

## Implementation Order

1. **Phase 1** - Enhanced Event Tracking (Foundation)
2. **Phase 2** - Feature Flags (Enable A/B testing)
3. **Phase 3** - PostHog MCP Insights (Analysis tools)
4. **Phase 4** - Session Replay Analysis (Deep dive)
5. **Phase 5** - Heatmap Configuration (Visual analysis)
6. **Phase 6** - Real-Time Alerts (Monitoring)
7. **Phase 7** - Enhanced User Properties (Segmentation)
8. **Phase 8** - Documentation & Testing (Completion)

## Notes

- All PostHog MCP tool calls should be made via the MCP server `plugin-posthog-posthog`
- Feature flags require PostHog project with feature flags enabled
- Session replay requires PostHog project with session replay enabled
- Heatmaps require PostHog project with heatmaps enabled
- Alerts may require PostHog paid plan (check plan limits)
- All new events should follow naming convention: `{area}_{action}` (e.g., `onboarding_step_viewed`)

---

## IMPLEMENTATION CHECKLIST

**Total Checklist Items: 178**

This comprehensive checklist covers:
- 32 event tracking implementation items
- 10 feature flag implementation items  
- 105 PostHog MCP insight creation items (10 funnels, 12 trends, 8 paths, 20 cohorts, 4 dashboards)
- 6 session replay configuration items
- 6 heatmap configuration items
- 4 alert configuration items
- 7 user property tracking items
- 8 documentation and testing items

### Phase 1: Enhanced Event Tracking

1. In `lib/posthog.ts`, add new event constants to `FunnelEvents` object: `onboarding_step_viewed`, `onboarding_step_interaction`, `onboarding_step_abandoned`, `onboarding_field_focused`, `onboarding_field_error`, `checkout_step_viewed`, `checkout_step_abandoned`, `experience_artwork_previewed`, `experience_artwork_preview_time`, `experience_filter_interaction`

2. In `lib/posthog.ts`, add helper function `captureSessionContext()` that captures session metadata (session_start_time, pages_viewed_count, time_on_site, referrer, device_type, browser, is_returning_user) and calls `posthog.capture('session_context', {...metadata})`

3. In `lib/posthog.ts`, add helper function `tagSessionForReplay(tag: string)` that calls `posthog.sessionRecording?.startRecording()` if not already recording, then calls `posthog.capture('session_tagged', { tag })`

4. In `lib/posthog.ts`, add helper function `setUserProperty(key: string, value: string | number | boolean)` that calls `posthog.people.set({ [key]: value })`

5. In `app/providers.tsx`, modify `PostHogWrapper` to call `captureSessionContext()` after PostHog initialization completes

6. In `app/providers.tsx`, modify `PostHogWrapper` to track `pages_viewed_count` and `time_on_site` on each pageview, updating session context

7. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, add `useState` to track `stepStartTime` for each step

8. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, add `useEffect` that fires `captureFunnelEvent(FunnelEvents.onboarding_step_viewed, { step, previous_step_time })` when step changes

9. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, modify `handleStep1` to call `captureFunnelEvent(FunnelEvents.onboarding_step_interaction, { button_type: 'owns_lamp_yes', step: 1 })` before state update

10. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, modify `handleStep1` to call `captureFunnelEvent(FunnelEvents.onboarding_step_interaction, { button_type: 'owns_lamp_no', step: 1 })` for "I'm new here" button

11. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, modify `handleStep2` to call `captureFunnelEvent(FunnelEvents.onboarding_step_interaction, { button_type: purpose === 'self' ? 'purpose_self' : 'purpose_gift', step: 2 })` before state update

12. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, add `onFocus` handler to name input field that calls `captureFunnelEvent(FunnelEvents.onboarding_field_focused, { field_name: 'name', step: 3 })`

13. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, add `useEffect` cleanup that tracks time spent on step and calls `captureFunnelEvent(FunnelEvents.onboarding_step_abandoned, { step, time_spent_seconds })` if user navigates away without completing

14. In `app/(store)/shop/experience/components/ExperienceOnboardingClient.tsx`, add tracking for `onboarding_time_seconds` by calculating time between `experience_quiz_started` and `experience_quiz_completed` in `handleComplete`

15. In `app/(store)/shop/experience/components/ExperienceOnboardingClient.tsx`, call `setUserProperty('onboarding_completed_at', new Date().toISOString())` and `setUserProperty('onboarding_time_seconds', calculatedTime)` in `handleComplete`

16. In `app/collector/components/onboarding-wizard.tsx`, add `useState` to track `stepStartTime` for each step

17. In `app/collector/components/onboarding-wizard.tsx`, add `useEffect` that fires `captureFunnelEvent(FunnelEvents.onboarding_step_viewed, { step: currentStep + 1, step_name: steps[currentStep].title, previous_step_time })` when `currentStep` changes

18. In `app/collector/components/onboarding-wizard.tsx`, add `onFocus` handlers to form fields (first_name, last_name, bio, phone) that call `captureFunnelEvent(FunnelEvents.onboarding_field_focused, { field_name, step: currentStep + 1 })`

19. In `app/collector/components/onboarding-wizard.tsx`, modify `handleNext` to call `captureFunnelEvent(FunnelEvents.onboarding_step_interaction, { button_type: 'next', step: currentStep + 1 })` before step change

20. In `app/collector/components/onboarding-wizard.tsx`, add validation error tracking that calls `captureFunnelEvent(FunnelEvents.onboarding_field_error, { field_name, error_message, step: currentStep + 1 })` when validation fails

21. In `app/collector/components/onboarding-wizard.tsx`, add `useEffect` cleanup that calls `captureFunnelEvent(FunnelEvents.onboarding_step_abandoned, { step: currentStep + 1, time_spent_seconds })` if user navigates away without completing

22. In `app/(store)/shop/experience/components/Configurator.tsx`, add `useState` to track `previewStartTime` when artwork is previewed

23. In `app/(store)/shop/experience/components/Configurator.tsx`, add `useEffect` that fires `captureFunnelEvent(FunnelEvents.experience_artwork_previewed, { item_id, item_name })` when `previewed` artwork changes

24. In `app/(store)/shop/experience/components/Configurator.tsx`, track `experience_artwork_preview_time` by calculating time between preview start and next action (preview change or add to cart)

25. In `app/(store)/shop/experience/components/FilterPanel.tsx`, add event tracking for filter panel open/close that calls `captureFunnelEvent(FunnelEvents.experience_filter_interaction, { action: 'panel_opened' })` or `{ action: 'panel_closed' }`

26. In `app/(store)/shop/experience/components/FilterPanel.tsx`, add event tracking for filter changes that calls `captureFunnelEvent(FunnelEvents.experience_filter_interaction, { action: 'filter_changed', filter_type, filter_value })`

27. In `components/shop/checkout/CheckoutLayout.tsx`, add `useState` to track which checkout step is currently viewed (address, payment, review)

28. In `components/shop/checkout/CheckoutLayout.tsx`, add `useEffect` that fires `captureFunnelEvent(FunnelEvents.checkout_step_viewed, { step_name: 'address' | 'payment' | 'review' })` when step changes

29. In `components/shop/checkout/CheckoutLayout.tsx`, add `onFocus` handlers to form fields that call `captureFunnelEvent(FunnelEvents.onboarding_field_focused, { field_name, step_name: 'checkout' })`

30. In `components/shop/checkout/CheckoutLayout.tsx`, add `useEffect` cleanup that calls `captureFunnelEvent(FunnelEvents.checkout_step_abandoned, { step_name, time_spent_seconds })` if user navigates away from checkout

31. In `app/(store)/shop/cart/page.tsx`, modify `handleCheckout` to call `tagSessionForReplay('checkout-started')` before redirecting to checkout

32. In `components/shop/checkout/CheckoutLayout.tsx`, modify error handling to call `tagSessionForReplay('checkout-error')` and `captureFunnelEvent(FunnelEvents.checkout_error, { error_message, step_name })` on checkout errors

### Phase 2: Feature Flags Implementation

33. Create new file `hooks/use-posthog-feature-flag.ts` with hook `usePostHogFeatureFlag(flagKey: string, defaultValue: boolean)` that uses `usePostHog()` from `posthog-js/react`, calls `posthog.isFeatureEnabled(flagKey)`, returns `{ isEnabled: boolean, isLoading: boolean }`, and handles loading state

34. In `hooks/use-posthog-feature-flag.ts`, add `useEffect` that calls `captureFunnelEvent('feature_flag_exposed', { flag: flagKey, variant: isEnabled ? 'enabled' : 'disabled' })` when flag value is determined

35. In `app/(store)/shop/experience/components/ExperienceClient.tsx`, import `usePostHogFeatureFlag` hook

36. In `app/(store)/shop/experience/components/ExperienceClient.tsx`, replace `getABVariantFromCookie()` and `setABVariantCookie()` logic with `const { isEnabled: showOnboarding } = usePostHogFeatureFlag('experience_onboarding_variant', true)`

37. In `app/(store)/shop/experience/components/ExperienceClient.tsx`, remove cookie-based A/B test functions (`getABVariantFromCookie`, `setABVariantCookie`) and related cookie constants

38. In `app/(store)/shop/experience/components/ExperienceClient.tsx`, update logic to use `showOnboarding` boolean instead of `abVariant === 'onboarding'`

39. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, add `usePostHogFeatureFlag('onboarding_progressive_disclosure', false)` to test progressive disclosure

40. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, conditionally show skip button based on `usePostHogFeatureFlag('onboarding_skip_enabled', true)`

41. In `app/collector/components/onboarding-wizard.tsx`, add `usePostHogFeatureFlag('collector_onboarding_auto_save', true)` to control auto-save behavior

42. In `app/collector/components/onboarding-wizard.tsx`, conditionally show skip button based on `usePostHogFeatureFlag('collector_onboarding_skip_allowed', true)`

### Phase 3: PostHog MCP Insights & Dashboards

43. Use PostHog MCP tool `insight-create-funnel` to create "Complete Purchase Funnel" with steps: `$pageview`, `experience_quiz_started` OR `view_item`, `experience_started` OR `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`, with breakdown by `owns_lamp`, `purpose`, `item_list_name`, `device_type`, conversion window 7 days

44. Use PostHog MCP tool `insight-create-funnel` to create "Experience Onboarding Funnel" with steps: `experience_quiz_started`, `onboarding_step_viewed` (step 1), `onboarding_step_viewed` (step 2), `onboarding_step_viewed` (step 3), `experience_quiz_completed`, `experience_started`, with breakdown by `owns_lamp`, `purpose`, `device_type`, conversion window 1 hour

45. Use PostHog MCP tool `insight-create-funnel` to create "Collector Onboarding Funnel" with steps: `collector_onboarding_started`, `onboarding_step_viewed` (step 0), `onboarding_step_viewed` (step 1), `onboarding_step_viewed` (step 2), `onboarding_step_viewed` (step 3), `collector_onboarding_completed`, with breakdown by `device_type`, `referrer`, conversion window 1 day

46. Use PostHog MCP tool `insight-create-funnel` to create "Checkout Completion Funnel" with steps: `begin_checkout`, `checkout_step_viewed` (address), `checkout_step_viewed` (payment), `add_payment_info`, `purchase`, with breakdown by `payment_type`, `device_type`, `country`, conversion window 1 hour

47. Use PostHog MCP tool `insight-create-from-query` to create "Onboarding Step Abandonment" trend showing count of `onboarding_step_abandoned` grouped by day, broken down by `step_number`, `step_name`

48. Use PostHog MCP tool `insight-create-from-query` to create "Onboarding Completion Time" trend showing average time between `experience_quiz_started` and `experience_quiz_completed`, grouped by day, broken down by `owns_lamp`, `purpose`

49. Use PostHog MCP tool `insight-create-from-query` to create "Checkout Step Abandonment" trend showing count of `checkout_step_abandoned` grouped by day, broken down by `step_name`

50. Use PostHog MCP tool `insight-create-from-query` to create "Artwork Preview Engagement" trend showing average `experience_artwork_preview_time` grouped by day, broken down by `item_list_name`

51. Use PostHog MCP tool `insight-create-paths` to create "Landing to Purchase Path" starting from `$pageview` where `$pathname` matches `/shop/street-collector` or `/shop/experience`, ending at `purchase`, including all custom events and pageviews

52. Use PostHog MCP tool `insight-create-paths` to create "Onboarding Completion Paths" starting from `experience_quiz_started`, ending at `experience_started`, including all onboarding events and pageviews

53. Use PostHog MCP tool `cohort-create` to create "Fast Onboarding Completers" cohort: users who complete `experience_quiz_started` → `experience_quiz_completed` in < 60 seconds

54. Use PostHog MCP tool `cohort-create` to create "Onboarding Drop-offs" cohort: users who trigger `onboarding_step_abandoned` but never complete onboarding

55. Use PostHog MCP tool `cohort-create` to create "High-Value Customers" cohort: users who complete `purchase` with `value` > $100

56. Use PostHog MCP tool `cohort-create` to create "Returning Purchasers" cohort: users who complete `purchase` more than once

57. Use PostHog MCP tool `dashboard-create` to create "Funnel & Onboarding Analytics" dashboard

58. Use PostHog MCP tool `add-insight-to-dashboard` to add "Complete Purchase Funnel" insight to "Funnel & Onboarding Analytics" dashboard

59. Use PostHog MCP tool `add-insight-to-dashboard` to add "Experience Onboarding Funnel" insight to "Funnel & Onboarding Analytics" dashboard

60. Use PostHog MCP tool `add-insight-to-dashboard` to add "Collector Onboarding Funnel" insight to "Funnel & Onboarding Analytics" dashboard

61. Use PostHog MCP tool `add-insight-to-dashboard` to add "Checkout Completion Funnel" insight to "Funnel & Onboarding Analytics" dashboard

62. Use PostHog MCP tool `add-insight-to-dashboard` to add "Onboarding Step Abandonment" trend to "Funnel & Onboarding Analytics" dashboard

63. Use PostHog MCP tool `add-insight-to-dashboard` to add "Onboarding Completion Time" trend to "Funnel & Onboarding Analytics" dashboard

64. Use PostHog MCP tool `add-insight-to-dashboard` to add "Checkout Step Abandonment" trend to "Funnel & Onboarding Analytics" dashboard

65. Use PostHog MCP tool `add-insight-to-dashboard` to add "Artwork Preview Engagement" trend to "Funnel & Onboarding Analytics" dashboard

66. Use PostHog MCP tool `add-insight-to-dashboard` to add "Landing to Purchase Path" insight to "Funnel & Onboarding Analytics" dashboard

67. Use PostHog MCP tool `add-insight-to-dashboard` to add "Onboarding Completion Paths" insight to "Funnel & Onboarding Analytics" dashboard

68. Use PostHog MCP tool `insight-create-funnel` to create "Mobile vs Desktop Purchase Funnel" with same steps as Complete Purchase Funnel, broken down by `device_type` (mobile, desktop, tablet), conversion window 7 days

69. Use PostHog MCP tool `insight-create-funnel` to create "New vs Returning User Funnel" with same steps as Complete Purchase Funnel, broken down by `is_returning_user` (true/false), conversion window 7 days

70. Use PostHog MCP tool `insight-create-funnel` to create "Traffic Source Purchase Funnel" with same steps as Complete Purchase Funnel, broken down by `$initial_referrer`, `utm_source`, `utm_medium`, `utm_campaign`, conversion window 7 days

71. Use PostHog MCP tool `insight-create-funnel` to create "Artist-Specific Purchase Funnel" with steps: `view_item` (where `item_brand` = specific artist), `add_to_cart` (same artist), `begin_checkout`, `purchase`, broken down by `item_brand`, conversion window 7 days

72. Use PostHog MCP tool `insight-create-funnel` to create "Experience vs Shop Purchase Funnel" with steps: `$pageview` (where `$pathname` contains `/shop/experience` OR `/shop/products`), `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, broken down by `item_list_name`, conversion window 7 days

73. Use PostHog MCP tool `insight-create-funnel` to create "Gift vs Self Purchase Funnel" with same steps as Complete Purchase Funnel, broken down by `purpose` (gift vs self), conversion window 7 days

74. Use PostHog MCP tool `insight-create-from-query` to create "Conversion Rate Over Time" trend showing percentage of users who complete `purchase` after `begin_checkout`, grouped by day, broken down by `device_type`, `country`

75. Use PostHog MCP tool `insight-create-from-query` to create "Average Order Value Trend" showing average `value` from `purchase` events, grouped by day, broken down by `item_list_name`, `purpose`

76. Use PostHog MCP tool `insight-create-from-query` to create "Cart Abandonment Rate" trend showing percentage of users who `add_to_cart` but don't `begin_checkout`, grouped by day, broken down by `device_type`, `item_list_name`

77. Use PostHog MCP tool `insight-create-from-query` to create "Onboarding Completion Rate" trend showing percentage of users who complete `experience_quiz_completed` after `experience_quiz_started`, grouped by day, broken down by `owns_lamp`, `purpose`, `device_type`

78. Use PostHog MCP tool `insight-create-from-query` to create "User Engagement Score" trend showing composite score based on `view_item` count, `add_to_cart` count, `experience_artwork_preview_time`, session duration, grouped by day, broken down by `device_type`, `is_returning_user`

79. Use PostHog MCP tool `insight-create-from-query` to create "Error Recovery Rate" trend showing percentage of users who recover after `checkout_error` or `payment_error` and complete `purchase`, grouped by day, broken down by `error_type`

80. Use PostHog MCP tool `insight-create-from-query` to create "Feature Adoption Rate" trend showing percentage of users who use experience configurator (`experience_started`) vs traditional shop (`view_item` on `/shop/products`), grouped by day, broken down by `device_type`, `is_returning_user`

81. Use PostHog MCP tool `insight-create-from-query` to create "User Retention Rate" trend showing percentage of users who return after 1, 7, and 30 days, grouped by day, broken down by `device_type`, `purpose`

82. Use PostHog MCP tool `insight-create-paths` to create "Error Recovery Paths" starting from `checkout_error` OR `payment_error`, ending at `purchase`, including all events between error and purchase

83. Use PostHog MCP tool `insight-create-paths` to create "Alternative Conversion Paths" starting from `$pageview` (any page), ending at `purchase`, including all events, excluding direct path through main funnel

84. Use PostHog MCP tool `insight-create-paths` to create "High-Value Customer Paths" starting from `$pageview`, ending at `purchase` (where `value` > $100), including all events

85. Use PostHog MCP tool `insight-create-paths` to create "Drop-off Recovery Paths" starting from `onboarding_step_abandoned` OR `checkout_step_abandoned`, ending at `purchase` OR `experience_started` OR `collector_onboarding_completed`, including all events after abandonment

86. Use PostHog MCP tool `insight-create-paths` to create "Mobile User Journey" starting from `$pageview` (where `device_type` = mobile), ending at `purchase`, including all events

87. Use PostHog MCP tool `insight-create-paths` to create "Returning User Journey" starting from `$pageview` (where `is_returning_user` = true), ending at `purchase`, including all events

88. Use PostHog MCP tool `cohort-create` to create "Mobile Users" cohort: users whose `device_type` = mobile for majority of sessions

89. Use PostHog MCP tool `cohort-create` to create "Desktop Users" cohort: users whose `device_type` = desktop for majority of sessions

90. Use PostHog MCP tool `cohort-create` to create "Organic Traffic Users" cohort: users who arrive via `utm_source` = organic or no UTM parameters

91. Use PostHog MCP tool `cohort-create` to create "Paid Traffic Users" cohort: users who arrive via `utm_source` = paid (Google Ads, Meta, etc.)

92. Use PostHog MCP tool `cohort-create` to create "Gift Purchasers" cohort: users who complete `purchase` with `purpose` = gift

93. Use PostHog MCP tool `cohort-create` to create "Lamp Owners" cohort: users who answer `owns_lamp` = true in onboarding

94. Use PostHog MCP tool `cohort-create` to create "New Lamp Buyers" cohort: users who answer `owns_lamp` = false in onboarding but complete `purchase` with lamp product

95. Use PostHog MCP tool `cohort-create` to create "High Engagement Users" cohort: users who trigger `experience_artwork_previewed` > 10 times in a session

96. Use PostHog MCP tool `cohort-create` to create "Quick Purchasers" cohort: users who complete `purchase` within 5 minutes of first `$pageview`

97. Use PostHog MCP tool `cohort-create` to create "Consideration Phase Users" cohort: users who `add_to_cart` but don't `begin_checkout` within 24 hours

98. Use PostHog MCP tool `cohort-create` to create "Multi-Artist Shoppers" cohort: users who `view_item` or `add_to_cart` products from > 3 different artists

99. Use PostHog MCP tool `cohort-create` to create "Experience Configurator Users" cohort: users who trigger `experience_started` event

100. Use PostHog MCP tool `cohort-create` to create "Traditional Shop Users" cohort: users who `view_item` on `/shop/products` but never trigger `experience_started`

101. Use PostHog MCP tool `cohort-create` to create "Collector Onboarding Drop-offs" cohort: users who start `collector_onboarding_started` but never complete

102. Use PostHog MCP tool `cohort-create` to create "Error Encountering Users" cohort: users who trigger `checkout_error` or `payment_error`

103. Use PostHog MCP tool `dashboard-create` to create "Retention & Engagement Analytics" dashboard

104. Use PostHog MCP tool `add-insight-to-dashboard` to add "User Retention Rate" trend to "Retention & Engagement Analytics" dashboard

105. Use PostHog MCP tool `add-insight-to-dashboard` to add "Feature Adoption Rate" trend to "Retention & Engagement Analytics" dashboard

106. Use PostHog MCP tool `add-insight-to-dashboard` to add "User Engagement Score" trend to "Retention & Engagement Analytics" dashboard

107. Use PostHog MCP tool `add-insight-to-dashboard` to add "Returning User Journey" path to "Retention & Engagement Analytics" dashboard

108. Use PostHog MCP tool `add-insight-to-dashboard` to add "Mobile User Journey" path to "Retention & Engagement Analytics" dashboard

109. Use PostHog MCP tool `add-insight-to-dashboard` to add "High-Value Customer Paths" path to "Retention & Engagement Analytics" dashboard

110. Use PostHog MCP tool `add-insight-to-dashboard` to add "Mobile Users" cohort analysis to "Retention & Engagement Analytics" dashboard

111. Use PostHog MCP tool `add-insight-to-dashboard` to add "Desktop Users" cohort analysis to "Retention & Engagement Analytics" dashboard

112. Use PostHog MCP tool `add-insight-to-dashboard` to add "High Engagement Users" cohort analysis to "Retention & Engagement Analytics" dashboard

113. Use PostHog MCP tool `add-insight-to-dashboard` to add "Experience Configurator Users" cohort analysis to "Retention & Engagement Analytics" dashboard

114. Use PostHog MCP tool `dashboard-create` to create "Conversion Optimization Analytics" dashboard

115. Use PostHog MCP tool `add-insight-to-dashboard` to add "Mobile vs Desktop Purchase Funnel" to "Conversion Optimization Analytics" dashboard

116. Use PostHog MCP tool `add-insight-to-dashboard` to add "New vs Returning User Funnel" to "Conversion Optimization Analytics" dashboard

117. Use PostHog MCP tool `add-insight-to-dashboard` to add "Traffic Source Purchase Funnel" to "Conversion Optimization Analytics" dashboard

118. Use PostHog MCP tool `add-insight-to-dashboard` to add "Experience vs Shop Purchase Funnel" to "Conversion Optimization Analytics" dashboard

119. Use PostHog MCP tool `add-insight-to-dashboard` to add "Gift vs Self Purchase Funnel" to "Conversion Optimization Analytics" dashboard

120. Use PostHog MCP tool `add-insight-to-dashboard` to add "Conversion Rate Over Time" trend to "Conversion Optimization Analytics" dashboard

121. Use PostHog MCP tool `add-insight-to-dashboard` to add "Average Order Value Trend" to "Conversion Optimization Analytics" dashboard

122. Use PostHog MCP tool `add-insight-to-dashboard` to add "Cart Abandonment Rate" trend to "Conversion Optimization Analytics" dashboard

123. Use PostHog MCP tool `add-insight-to-dashboard` to add "Error Recovery Rate" trend to "Conversion Optimization Analytics" dashboard

124. Use PostHog MCP tool `add-insight-to-dashboard` to add "Error Recovery Paths" to "Conversion Optimization Analytics" dashboard

125. Use PostHog MCP tool `add-insight-to-dashboard` to add "Drop-off Recovery Paths" to "Conversion Optimization Analytics" dashboard

126. Use PostHog MCP tool `add-insight-to-dashboard` to add "Alternative Conversion Paths" to "Conversion Optimization Analytics" dashboard

127. Use PostHog MCP tool `dashboard-create` to create "Business Intelligence Analytics" dashboard

128. Use PostHog MCP tool `add-insight-to-dashboard` to add "Artist-Specific Purchase Funnel" to "Business Intelligence Analytics" dashboard

129. Use PostHog MCP tool `add-insight-to-dashboard` to add "Average Order Value Trend" to "Business Intelligence Analytics" dashboard

130. Use PostHog MCP tool `add-insight-to-dashboard` to add "High-Value Customers" cohort analysis to "Business Intelligence Analytics" dashboard

131. Use PostHog MCP tool `add-insight-to-dashboard` to add "Quick Purchasers" cohort analysis to "Business Intelligence Analytics" dashboard

132. Use PostHog MCP tool `add-insight-to-dashboard` to add "Multi-Artist Shoppers" cohort analysis to "Business Intelligence Analytics" dashboard

133. Use PostHog MCP tool `add-insight-to-dashboard` to add "High-Value Customer Paths" to "Business Intelligence Analytics" dashboard

134. Use PostHog MCP tool `add-insight-to-dashboard` to add "Gift Purchasers" cohort analysis to "Business Intelligence Analytics" dashboard

135. Use PostHog MCP tool `add-insight-to-dashboard` to add "Lamp Owners" cohort analysis to "Business Intelligence Analytics" dashboard

136. Use PostHog MCP tool `add-insight-to-dashboard` to add "New Lamp Buyers" cohort analysis to "Business Intelligence Analytics" dashboard

137. Use PostHog MCP tool `add-insight-to-dashboard` to add "Consideration Phase Users" cohort analysis to "Business Intelligence Analytics" dashboard

### Phase 4: Session Replay Analysis

138. In `app/(store)/shop/experience/components/IntroQuiz.tsx`, call `tagSessionForReplay('onboarding-dropoff')` in the cleanup effect when step is abandoned

139. In `components/shop/checkout/CheckoutLayout.tsx`, call `tagSessionForReplay('checkout-dropoff')` in cleanup effect when checkout is abandoned

140. In `components/shop/checkout/CheckoutLayout.tsx`, call `tagSessionForReplay('checkout-error')` in error handler

141. In `app/api/checkout/create/route.ts`, add error handling that calls `tagSessionForReplay('checkout-error')` and `captureFunnelEvent(FunnelEvents.checkout_error, { error_message, endpoint: 'create' })` on API errors

142. In `app/api/stripe/webhook/route.ts`, add error handling that calls `tagSessionForReplay('payment-error')` and `captureFunnelEvent(FunnelEvents.payment_error, { error_message, event_type })` on payment webhook errors

143. In `app/providers.tsx`, verify session recording configuration includes mask for sensitive fields (email, credit card) in `session_recording` config object

### Phase 5: Heatmap Configuration

144. Verify `enable_heatmaps: withRecording` is set in `app/providers.tsx` PostHog initialization (already configured)

145. In PostHog UI, create heatmap for `/shop/experience/onboarding` page (step 1) to analyze button clicks

146. In PostHog UI, create heatmap for `/shop/experience/onboarding/2` page (step 2) to analyze button clicks

147. In PostHog UI, create heatmap for `/shop/experience/onboarding/3` page (step 3) to analyze form interactions

148. In PostHog UI, create heatmap for `/shop/cart` page to analyze checkout button clicks

149. In PostHog UI, create heatmap for `/collector/welcome` page to analyze onboarding interactions

### Phase 6: Real-Time Alerts

150. In PostHog UI or via MCP tool `alert-create`, create alert "Onboarding Drop-off Alert" that triggers when `onboarding_step_abandoned` count increases by >50% compared to previous 7-day average, with email/Slack notification

151. In PostHog UI or via MCP tool `alert-create`, create alert "Checkout Abandonment Alert" that triggers when `checkout_step_abandoned` count increases by >30% compared to previous 7-day average, with email/Slack notification

152. In PostHog UI or via MCP tool `alert-create`, create alert "Conversion Rate Alert" that triggers when purchase funnel conversion rate drops by >20% compared to previous 7-day average, with email/Slack notification

153. In PostHog UI or via MCP tool `alert-create`, create alert "Error Rate Alert" that triggers when `checkout_error` or `payment_error` count increases by >100% compared to previous 7-day average, with email/Slack notification

### Phase 7: Enhanced User Properties

154. In `app/track/[token]/page.tsx`, add logic to calculate `total_purchases` by querying previous purchases for user

155. In `app/track/[token]/page.tsx`, add logic to calculate `total_spent` by summing purchase values for user

156. In `app/track/[token]/page.tsx`, call `setUserProperty('first_purchase_at', purchaseDate)` if this is user's first purchase

157. In `app/track/[token]/page.tsx`, call `setUserProperty('total_purchases', count)` after purchase

158. In `app/track/[token]/page.tsx`, call `setUserProperty('total_spent', totalAmount)` after purchase

159. In `app/track/[token]/page.tsx`, add logic to determine `favorite_artist` from purchase history and call `setUserProperty('favorite_artist', artistName)`

160. In `app/providers.tsx`, modify `PostHogIdentify` to set `preferred_device` user property based on device type detection

### Phase 8: Documentation & Testing

161. In `docs/features/analytics/EVENTS_MAP.md`, add new section "Micro-Interaction Events" documenting all new events: `onboarding_step_viewed`, `onboarding_step_interaction`, `onboarding_step_abandoned`, `onboarding_field_focused`, `onboarding_field_error`, `checkout_step_viewed`, `checkout_step_abandoned`, `experience_artwork_previewed`, `experience_artwork_preview_time`, `experience_filter_interaction`

162. In `docs/features/analytics/EVENTS_MAP.md`, add section "Feature Flags" documenting feature flags: `experience_onboarding_variant`, `onboarding_progressive_disclosure`, `onboarding_skip_enabled`, `collector_onboarding_auto_save`, `collector_onboarding_skip_allowed`

163. In `docs/features/analytics/EVENTS_MAP.md`, add section "PostHog MCP Insights" documenting all created funnels (10 total), trends (12 total), paths (8 total), and cohorts (20 total) with their purposes

164. In `docs/features/analytics/README.md`, add section "Feature Flags" explaining how to use `usePostHogFeatureFlag` hook and how to create/manage flags in PostHog UI

165. In `docs/features/analytics/README.md`, add section "PostHog MCP Insights" explaining how insights were created via MCP and how to create new ones, including all 4 dashboards

166. In `docs/features/analytics/README.md`, add section "Session Replay Analysis" explaining how sessions are tagged and how to analyze tagged sessions in PostHog

167. In `docs/features/analytics/README.md`, add section "Heatmaps" explaining how heatmaps are configured and how to create new ones in PostHog UI

168. In `docs/features/analytics/README.md`, add section "Alerts" explaining how alerts are configured and how to create new ones

169. Test all new events fire correctly by adding `?__posthog_debug=true` to URLs and verifying events in browser console

170. Test feature flags work correctly by creating flags in PostHog UI and verifying hook returns correct values

171. Verify all PostHog MCP insights are created and visible in PostHog dashboards (4 dashboards total)

172. Verify session replay tags work by triggering drop-off events and checking PostHog session replay list for tagged sessions

173. Verify heatmaps capture interactions by interacting with onboarding pages and checking PostHog heatmaps

174. Test alerts trigger correctly by simulating conditions that should trigger alerts

175. Test on mobile device to verify mobile-specific tracking works

176. Test on desktop device to verify desktop-specific tracking works

177. Verify user properties are set correctly by checking PostHog user profile after completing onboarding and purchase

178. Create commit log document in `docs/COMMIT_LOGS/posthog-funnel-improvements-YYYY-MM-DD.md` documenting all changes made
