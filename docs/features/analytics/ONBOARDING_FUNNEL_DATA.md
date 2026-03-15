# Experience Onboarding Funnel Data Analysis
**Date:** March 15, 2026  
**Time Period:** Last 30 days  
**Data Source:** PostHog Analytics

## Summary

This document contains actual onboarding funnel data queried from PostHog for the Experience onboarding flow. All insights have been created in PostHog and can be accessed via the provided URLs.

---

## 1. Experience Onboarding Funnel - Overall Conversion Rates

**Insight ID:** 3559729  
**URL:** https://eu.posthog.com/project/138294/insights/BkndQJV9

### Funnel Steps:
1. **experience_quiz_started** → 56 users
2. **onboarding_step_viewed (step 1)** → 0 users (0% conversion)
3. **onboarding_step_viewed (step 2)** → 0 users (0% conversion)
4. **onboarding_step_viewed (step 3)** → 0 users (0% conversion)
5. **experience_quiz_completed** → 0 users (0% conversion)
6. **experience_started** → 0 users (0% conversion)

### Key Finding:
⚠️ **Critical Issue:** The step-by-step funnel shows 0 conversions at all steps after `experience_quiz_started`. This suggests:
- The `onboarding_step_viewed` events may not be firing correctly
- The `step_number` property filter may not be matching event properties
- Events may be using different property names than expected

### Simplified Funnel (Without Step Filters):
When querying without step_number filters, we see:
- **experience_quiz_started:** 56 users
- **experience_quiz_completed:** 43 users (76.8% conversion)
- **experience_started:** 43 users (100% conversion from completed)

---

## 2. Onboarding Step Abandonment Data

**Insight ID:** 3559730  
**URL:** https://eu.posthog.com/project/138294/insights/IupB66y8

### Abandonment Events by Step:
**Result:** No abandonment events found in the last 30 days.

**Breakdown by step_number:**
- No data available (0 events)

### Analysis:
- Either `onboarding_step_abandoned` events are not being tracked
- Or users are not abandoning steps (unlikely)
- **Recommendation:** Verify that `onboarding_step_abandoned` events are being fired correctly in the codebase

---

## 3. A/B Test Comparison - Onboarding vs Skip Variants

**Insight ID:** 3559732  
**URL:** https://eu.posthog.com/project/138294/insights/rdYzbFRa

### Overall Funnel (All Variants):
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 56 | 100% |
| experience_quiz_completed | 43 | 76.8% |
| experience_started | 43 | 100% (from completed) |

**Average Conversion Times:**
- Quiz Started → Quiz Completed: 7.7 seconds (avg), 6.0 seconds (median)
- Quiz Completed → Experience Started: 0.57 seconds (avg), 0.46 seconds (median)

### Breakdown by `experience_ab_variant`:

#### Variant: "" (Empty/No Variant Set) - 55 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 55 | 100% |
| experience_quiz_completed | 42 | 76.4% |
| experience_started | 42 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 7.7 seconds (avg), 6.0 seconds (median)
- Quiz Completed → Experience Started: 0.57 seconds (avg), 0.46 seconds (median)

#### Variant: "onboarding" - 1 user
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 1 | 100% |
| experience_quiz_completed | 1 | 100% |
| experience_started | 1 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 5.2 seconds
- Quiz Completed → Experience Started: 0.92 seconds

### Key Findings:
⚠️ **A/B Test Issue:** 
- Only 1 user has `experience_ab_variant: 'onboarding'` set
- 55 users have empty/null variant (likely defaulting to 'skip' or not set)
- **Recommendation:** Verify that the A/B test variant is being properly set as a person property in PostHog

---

## 4. Experience Quiz Skip Rate

**Insight ID:** 3559731  
**URL:** https://eu.posthog.com/project/138294/insights/wIyhcYa5

### Skip Events:
**Total `experience_quiz_skipped` events:** 0

**Daily Breakdown (Last 30 days):**
- All days show 0 skip events

### Analysis:
- Either users are not skipping the quiz
- Or `experience_quiz_skipped` events are not being tracked
- **Recommendation:** Verify skip button functionality and event tracking

---

## 5. Onboarding Completion Time Data

**Insight ID:** 3559733  
**URL:** https://eu.posthog.com/project/138294/insights/lMfmOd5l

### Completion Time by Step:
**Result:** No data available

**Breakdown by step_number:**
- No `experience_quiz_step_completed` events found with `time_on_step` property

### Analysis:
- Either `experience_quiz_step_completed` events are not being tracked
- Or the `time_on_step` property is not being set
- **Recommendation:** Verify step completion tracking and time measurement

---

## 6. Breakdown Analysis

### 6.1 Breakdown by Device Type

**Insight ID:** 3559734  
**URL:** https://eu.posthog.com/project/138294/insights/a4uYvCAH

**Overall (No device_type set):**
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 56 | 100% |
| experience_quiz_completed | 43 | 76.8% |
| experience_started | 43 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 7.6 seconds (avg), 5.8 seconds (median)
- Quiz Completed → Experience Started: 0.58 seconds (avg), 0.47 seconds (median)

**Note:** All users have empty `device_type` property, suggesting device tracking may not be implemented.

---

### 6.2 Breakdown by Owns Lamp

**Insight ID:** 3559735  
**URL:** https://eu.posthog.com/project/138294/insights/UzJX1Hei

#### Users Who Don't Own Lamp (`owns_lamp: false`) - 40 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 40 | 100% |
| experience_quiz_completed | 39 | 97.5% |
| experience_started | 39 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 7.7 seconds (avg), 5.8 seconds (median)
- Quiz Completed → Experience Started: 0.59 seconds (avg), 0.47 seconds (median)

#### Users Who Own Lamp (`owns_lamp: true`) - 6 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 6 | 100% |
| experience_quiz_completed | 4 | 66.7% |
| experience_started | 4 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 6.7 seconds (avg), 5.8 seconds (median)
- Quiz Completed → Experience Started: 0.46 seconds (avg), 0.45 seconds (median)

#### Users with Unknown Lamp Status (`owns_lamp: ""`) - 10 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 10 | 100% |
| experience_quiz_completed | 0 | 0% |
| experience_started | 0 | 0% |

**Key Finding:**
⚠️ **Users without `owns_lamp` property have 0% completion rate** - This suggests the property is critical for quiz completion.

---

### 6.3 Breakdown by Purpose

**Insight ID:** 3559736  
**URL:** https://eu.posthog.com/project/138294/insights/QM1PSFRf

#### Self Purchase (`purpose: self`) - 42 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 42 | 100% |
| experience_quiz_completed | 40 | 95.2% |
| experience_started | 40 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 7.7 seconds (avg), 6.0 seconds (median)
- Quiz Completed → Experience Started: 0.58 seconds (avg), 0.46 seconds (median)

#### Gift Purchase (`purpose: gift`) - 3 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 3 | 100% |
| experience_quiz_completed | 3 | 100% |
| experience_started | 3 | 100% |

**Conversion Times:**
- Quiz Started → Quiz Completed: 6.8 seconds (avg), 5.2 seconds (median)
- Quiz Completed → Experience Started: 0.63 seconds (avg), 0.65 seconds (median)

#### Users with Unknown Purpose (`purpose: ""`) - 11 users
| Step | Count | Conversion Rate |
|------|-------|-----------------|
| experience_quiz_started | 11 | 100% |
| experience_quiz_completed | 0 | 0% |
| experience_started | 0 | 0% |

**Key Finding:**
⚠️ **Users without `purpose` property have 0% completion rate** - This property is also critical for quiz completion.

---

## Key Recommendations

### 1. Event Tracking Issues
- **`onboarding_step_viewed` events:** Not appearing in funnel with step_number filters. Verify:
  - Event is firing correctly
  - `step_number` property is being set
  - Property name matches exactly (case-sensitive)

- **`onboarding_step_abandoned` events:** No events found. Verify tracking implementation.

- **`experience_quiz_skipped` events:** No events found. Verify skip button functionality.

- **`experience_quiz_step_completed` events:** No events with `time_on_step` property. Verify:
  - Event is firing
  - `time_on_step` property is being calculated and set

### 2. Property Tracking Issues
- **`device_type`:** All users have empty value. Implement device type tracking.
- **`experience_ab_variant`:** Only 1 user has variant set. Verify A/B test implementation.
- **`owns_lamp`:** Users without this property have 0% completion. Ensure property is always set.
- **`purpose`:** Users without this property have 0% completion. Ensure property is always set.

### 3. Conversion Rate Insights
- **Overall completion rate:** 76.8% (43/56) is good, but could be improved
- **Users without `owns_lamp` or `purpose`:** 0% completion rate - critical issue
- **Lamp owners:** Lower completion rate (66.7%) vs non-owners (97.5%) - investigate why
- **Gift purchasers:** 100% completion rate (3/3) - small sample but promising

### 4. Conversion Time Insights
- **Average quiz completion time:** 7.7 seconds - very fast, good UX
- **Time to start experience:** 0.57 seconds - excellent, no friction

---

## Next Steps

1. **Fix event tracking:**
   - Verify `onboarding_step_viewed` events fire with correct `step_number` property
   - Implement `onboarding_step_abandoned` tracking
   - Implement `experience_quiz_skipped` tracking
   - Add `time_on_step` to `experience_quiz_step_completed` events

2. **Fix property tracking:**
   - Ensure `device_type` is set on all events
   - Ensure `experience_ab_variant` is set as person property for A/B test
   - Ensure `owns_lamp` is always set (default to false if unknown)
   - Ensure `purpose` is always set (require selection before proceeding)

3. **Investigate completion blockers:**
   - Why do users without `owns_lamp` or `purpose` have 0% completion?
   - Why do lamp owners have lower completion rate?
   - Review session replays for users who start but don't complete

4. **Re-query after fixes:**
   - Wait 24-48 hours after implementing fixes
   - Re-run all queries to get updated data
   - Compare before/after metrics

---

## PostHog Insight URLs

All insights created in PostHog:

1. **Experience Onboarding Funnel:** https://eu.posthog.com/project/138294/insights/BkndQJV9
2. **Onboarding Step Abandonment:** https://eu.posthog.com/project/138294/insights/IupB66y8
3. **Experience Quiz Skip Rate:** https://eu.posthog.com/project/138294/insights/wIyhcYa5
4. **A/B Test Comparison:** https://eu.posthog.com/project/138294/insights/rdYzbFRa
5. **Onboarding Completion Time:** https://eu.posthog.com/project/138294/insights/lMfmOd5l
6. **Breakdown by Device:** https://eu.posthog.com/project/138294/insights/a4uYvCAH
7. **Breakdown by Owns Lamp:** https://eu.posthog.com/project/138294/insights/UzJX1Hei
8. **Breakdown by Purpose:** https://eu.posthog.com/project/138294/insights/QM1PSFRf

---

**Generated:** March 15, 2026  
**Data Period:** February 13, 2026 - March 15, 2026 (30 days)
