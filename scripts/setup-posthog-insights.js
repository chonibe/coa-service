#!/usr/bin/env node
/**
 * PostHog Insights & Dashboard Setup Script
 *
 * Creates all funnels, trends, paths, cohorts, and dashboards for the
 * "PostHog Funnel & Onboarding Improvements" plan.
 *
 * Usage:
 *   POSTHOG_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 node scripts/setup-posthog-insights.js
 *
 * Get your Personal API key from: https://app.posthog.com/settings/user-api-keys
 * Get your Project ID from: https://app.posthog.com/settings/project
 */

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com'

if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
  console.error('❌ Required: POSTHOG_API_KEY and POSTHOG_PROJECT_ID env vars')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${POSTHOG_API_KEY}`,
  'Content-Type': 'application/json',
}

async function api(method, path, body) {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}${path}`
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    // If creating and already exists (409), return null to skip
    if (method === 'POST' && res.status === 409) {
      return null
    }
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function findExisting(name, type) {
  try {
    const path = type === 'dashboard' ? '/dashboards/' : type === 'cohort' ? '/cohorts/' : '/insights/'
    const list = await api('GET', path)
    const items = type === 'dashboard' ? list.results : type === 'cohort' ? list.results : list.results
    return items.find((item) => item.name === name || item.name?.trim() === name.trim())
  } catch {
    return null
  }
}

// ─── INSIGHT DEFINITIONS ─────────────────────────────────────────────────────

const FUNNELS = [
  {
    name: '01 · Complete Purchase Funnel',
    description: 'Full path from landing to purchase across all surfaces',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: '$pageview', name: 'Page View' },
          { kind: 'EventsNode', event: 'view_item', name: 'View Item' },
          { kind: 'EventsNode', event: 'add_to_cart', name: 'Add to Cart' },
          { kind: 'EventsNode', event: 'begin_checkout', name: 'Begin Checkout' },
          { kind: 'EventsNode', event: 'purchase', name: 'Purchase' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '02 · Experience Onboarding Funnel',
    description: 'Experience quiz completion funnel with skip tracking',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_started', name: 'Experience Started' },
          { kind: 'EventsNode', event: 'experience_quiz_started', name: 'Quiz Started' },
          { kind: 'EventsNode', event: 'experience_quiz_step_completed', name: 'Step 1 Completed', properties: [{ key: 'step', value: 1, operator: 'exact', type: 'event' }] },
          { kind: 'EventsNode', event: 'experience_quiz_step_completed', name: 'Step 2 Completed', properties: [{ key: 'step', value: 2, operator: 'exact', type: 'event' }] },
          { kind: 'EventsNode', event: 'experience_quiz_completed', name: 'Quiz Completed' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '03 · Collector Onboarding Funnel',
    description: 'Collector onboarding wizard 4-step completion',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'collector_onboarding_started', name: 'Started' },
          { kind: 'EventsNode', event: 'collector_onboarding_step_completed', name: 'Step 1 Done', properties: [{ key: 'step', value: 1, operator: 'exact', type: 'event' }] },
          { kind: 'EventsNode', event: 'collector_onboarding_step_completed', name: 'Step 2 Done', properties: [{ key: 'step', value: 2, operator: 'exact', type: 'event' }] },
          { kind: 'EventsNode', event: 'collector_onboarding_step_completed', name: 'Step 3 Done', properties: [{ key: 'step', value: 3, operator: 'exact', type: 'event' }] },
          { kind: 'EventsNode', event: 'collector_onboarding_completed', name: 'Completed' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '04 · Checkout Completion Funnel',
    description: 'Cart checkout to successful payment',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'view_cart', name: 'View Cart' },
          { kind: 'EventsNode', event: 'begin_checkout', name: 'Begin Checkout' },
          { kind: 'EventsNode', event: 'add_shipping_info', name: 'Add Shipping' },
          { kind: 'EventsNode', event: 'add_payment_info', name: 'Add Payment' },
          { kind: 'EventsNode', event: 'purchase', name: 'Purchase' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '05 · Experience-to-Purchase Funnel',
    description: 'Lamp configurator through to purchase',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_started', name: 'Experience Started' },
          { kind: 'EventsNode', event: 'view_item', name: 'View Item' },
          { kind: 'EventsNode', event: 'add_to_cart', name: 'Add to Cart' },
          { kind: 'EventsNode', event: 'begin_checkout', name: 'Begin Checkout' },
          { kind: 'EventsNode', event: 'purchase', name: 'Purchase' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '06 · Claim Flow Funnel',
    description: 'Guest purchaser claim flow conversion',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'collector_claim_page_viewed', name: 'Claim Page Viewed' },
          { kind: 'EventsNode', event: 'collector_claim_google_clicked', name: 'Google Sign-In Clicked' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '07 · Onboarding→Experience Redirect Funnel',
    description: 'Users redirected to onboarding and returning to experience',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_redirected_to_onboarding', name: 'Redirected to Onboarding' },
          { kind: 'EventsNode', event: 'collector_onboarding_started', name: 'Onboarding Started' },
          { kind: 'EventsNode', event: 'collector_onboarding_completed', name: 'Onboarding Completed' },
          { kind: 'EventsNode', event: 'experience_started', name: 'Returned to Experience' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '08 · Error Recovery Funnel',
    description: 'Users who hit checkout errors and completed purchase',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'checkout_error', name: 'Checkout Error' },
          { kind: 'EventsNode', event: 'begin_checkout', name: 'Retry Checkout' },
          { kind: 'EventsNode', event: 'purchase', name: 'Purchase' },
        ],
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '09 · Gift vs Self Purchase Funnel',
    description: 'Conversion by quiz purpose answer',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_quiz_completed', name: 'Quiz Completed' },
          { kind: 'EventsNode', event: 'add_to_cart', name: 'Add to Cart' },
          { kind: 'EventsNode', event: 'purchase', name: 'Purchase' },
        ],
        breakdownFilter: { breakdown: 'purpose', breakdown_type: 'event' },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: '10 · A/B Test Onboarding vs Skip Funnel',
    description: 'Compare conversion: onboarding variant vs skip variant',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_ab_variant_known', name: 'AB Variant Known' },
          { kind: 'EventsNode', event: 'add_to_cart', name: 'Add to Cart' },
          { kind: 'EventsNode', event: 'purchase', name: 'Purchase' },
        ],
        breakdownFilter: { breakdown: 'variant', breakdown_type: 'event' },
        dateRange: { date_from: '-30d' },
      },
    },
  },
]

const TRENDS = [
  {
    name: 'Trend · Onboarding Completion Rate',
    description: 'Experience quiz completion rate over time',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_quiz_completed', math: 'total', name: 'Completions' },
          { kind: 'EventsNode', event: 'experience_quiz_started', math: 'total', name: 'Starts' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Quiz Skip Rate',
    description: 'How often users skip the experience quiz',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_quiz_skipped', math: 'total', name: 'Skipped' },
          { kind: 'EventsNode', event: 'experience_quiz_started', math: 'total', name: 'Started' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Checkout Error Rate',
    description: 'Checkout errors over time',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'checkout_error', math: 'total', name: 'Checkout Errors' },
          { kind: 'EventsNode', event: 'begin_checkout', math: 'total', name: 'Checkout Attempts' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Payment Error Rate',
    description: 'Payment errors over time',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'payment_error', math: 'total', name: 'Payment Errors' },
          { kind: 'EventsNode', event: 'begin_checkout', math: 'total', name: 'Checkout Attempts' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Daily Purchase Volume',
    description: 'Number of purchases per day',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'purchase', math: 'total', name: 'Purchases' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Add-to-Cart vs Purchase',
    description: 'Cart conversion over time',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'add_to_cart', math: 'total', name: 'Add to Cart' },
          { kind: 'EventsNode', event: 'purchase', math: 'total', name: 'Purchase' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Collector Onboarding Completion',
    description: 'Collector wizard completion rate',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'collector_onboarding_completed', math: 'total', name: 'Completed' },
          { kind: 'EventsNode', event: 'collector_onboarding_started', math: 'total', name: 'Started' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Promo Code Usage',
    description: 'Promo code applications over time',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'promo_code_applied', math: 'total', name: 'Promo Applied' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Checkout Cancellation Rate',
    description: 'Users returning from Stripe with cancellation',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'checkout_cancelled', math: 'total', name: 'Cancelled' },
          { kind: 'EventsNode', event: 'begin_checkout', math: 'total', name: 'Initiated' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Experience Filter Usage',
    description: 'How often filters are applied in the configurator',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'experience_filter_applied', math: 'total', name: 'Filter Applied' },
          { kind: 'EventsNode', event: 'experience_started', math: 'total', name: 'Experience Started' },
        ],
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · Session Context — Device Split',
    description: 'Mobile vs desktop users over time',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'session_context', math: 'total', name: 'Sessions' },
        ],
        breakdownFilter: { breakdown: 'device_type', breakdown_type: 'event' },
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
  {
    name: 'Trend · New vs Returning Users',
    description: 'Returning user ratio from session context',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: [
          { kind: 'EventsNode', event: 'session_context', math: 'total', name: 'Sessions' },
        ],
        breakdownFilter: { breakdown: 'is_returning_user', breakdown_type: 'event' },
        dateRange: { date_from: '-30d' },
        interval: 'day',
      },
    },
  },
]

const PATHS = [
  {
    name: 'Path · Landing to Purchase',
    description: 'Most common paths from entry to purchase event',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['$pageview', 'custom_event'],
          startPoint: '$pageview',
          endPoint: 'purchase',
          pathGroupings: ['/shop/experience', '/shop/cart'],
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · After Onboarding Quiz',
    description: 'Where users go after completing the experience quiz',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event'],
          startPoint: 'experience_quiz_completed',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · After Checkout Error',
    description: 'What users do after a checkout error',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event'],
          startPoint: 'checkout_error',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · After Quiz Skip',
    description: 'Navigation after skipping the experience quiz',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event'],
          startPoint: 'experience_quiz_skipped',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · After Collector Onboarding Complete',
    description: 'Where collectors go post-onboarding',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event', '$pageview'],
          startPoint: 'collector_onboarding_completed',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · Purchase to Return Visit',
    description: 'Post-purchase journey and return paths',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event', '$pageview'],
          startPoint: 'purchase',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · Claim Flow Navigation',
    description: 'Actions taken on the collector claim page',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event'],
          startPoint: 'collector_claim_page_viewed',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
  {
    name: 'Path · Drop-off from Cart',
    description: 'What users do after viewing cart without checking out',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'PathsQuery',
        pathsFilter: {
          includeEventTypes: ['custom_event', '$pageview'],
          startPoint: 'view_cart',
          endPoint: 'begin_checkout',
        },
        dateRange: { date_from: '-30d' },
      },
    },
  },
]

const COHORTS = [
  { name: 'Cohort · Completed Experience Quiz', description: 'Users who completed the quiz (not skipped)', filters: { properties: { type: 'AND', values: [{ key: 'experience_quiz_completed', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Skipped Experience Quiz', description: 'Users who skipped the experience quiz', filters: { properties: { type: 'AND', values: [{ key: 'experience_quiz_skipped', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Completed Collector Onboarding', description: 'Users who finished the collector wizard', filters: { properties: { type: 'AND', values: [{ key: 'collector_onboarding_completed', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Abandoned Checkout', description: 'Users who started checkout but never purchased', filters: { properties: { type: 'AND', values: [{ key: 'begin_checkout', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }, { key: 'purchase', type: 'behavioral', value: 'performed_event', negation: true, event_type: 'events' }] } } },
  { name: 'Cohort · Purchasers', description: 'Users who have made at least one purchase', filters: { properties: { type: 'AND', values: [{ key: 'purchase', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Had Checkout Error', description: 'Users who encountered a checkout error', filters: { properties: { type: 'AND', values: [{ key: 'checkout_error', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · A/B Onboarding Variant', description: 'Users assigned to the onboarding A/B variant', filters: { properties: { type: 'AND', values: [{ key: 'experience_ab_variant', value: 'onboarding', type: 'person', operator: 'exact' }] } } },
  { name: 'Cohort · A/B Skip Variant', description: 'Users assigned to the skip A/B variant', filters: { properties: { type: 'AND', values: [{ key: 'experience_ab_variant', value: 'skip', type: 'person', operator: 'exact' }] } } },
  { name: 'Cohort · Mobile Users', description: 'Users whose preferred device is mobile', filters: { properties: { type: 'AND', values: [{ key: 'preferred_device', value: 'mobile', type: 'person', operator: 'exact' }] } } },
  { name: 'Cohort · Desktop Users', description: 'Users whose preferred device is desktop', filters: { properties: { type: 'AND', values: [{ key: 'preferred_device', value: 'desktop', type: 'person', operator: 'exact' }] } } },
  { name: 'Cohort · Gift Purchasers', description: 'Users who said they are buying a gift', filters: { properties: { type: 'AND', values: [{ key: 'experience_quiz_completed', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events', properties: [{ key: 'purpose', value: 'gift', operator: 'exact', type: 'event' }] }] } } },
  { name: 'Cohort · Returning Users', description: 'Users who are identified as returning visitors', filters: { properties: { type: 'AND', values: [{ key: 'session_context', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events', properties: [{ key: 'is_returning_user', value: 'true', operator: 'exact', type: 'event' }] }] } } },
  { name: 'Cohort · Used Promo Code', description: 'Users who applied a promo code', filters: { properties: { type: 'AND', values: [{ key: 'promo_code_applied', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Redirected to Onboarding', description: 'Users who were redirected from experience to onboarding', filters: { properties: { type: 'AND', values: [{ key: 'experience_redirected_to_onboarding', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · High-Engagement (3+ Experience Sessions)', description: 'Users who started the experience 3+ times', filters: { properties: { type: 'AND', values: [{ key: 'experience_started', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events', operator_value: 3, operator: 'gte' }] } } },
  { name: 'Cohort · Lamp Owners', description: 'Users who said Yes I own a lamp in the quiz', filters: { properties: { type: 'AND', values: [{ key: 'experience_quiz_completed', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events', properties: [{ key: 'owns_lamp', value: 'true', operator: 'exact', type: 'event' }] }] } } },
  { name: 'Cohort · Claim Flow Users', description: 'Guest purchasers who visited the claim page', filters: { properties: { type: 'AND', values: [{ key: 'collector_claim_page_viewed', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Collector Onboarding Skippers', description: 'Users who skipped collector onboarding', filters: { properties: { type: 'AND', values: [{ key: 'collector_onboarding_skipped', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }] } } },
  { name: 'Cohort · Repeat Purchasers', description: 'Users with 2 or more purchases', filters: { properties: { type: 'AND', values: [{ key: 'total_purchases', value: '2', type: 'person', operator: 'gte' }] } } },
  { name: 'Cohort · First-Time Purchasers', description: 'Users who made their first purchase this period', filters: { properties: { type: 'AND', values: [{ key: 'purchase', type: 'behavioral', value: 'performed_event', negation: false, event_type: 'events' }, { key: 'total_purchases', value: '1', type: 'person', operator: 'exact' }] } } },
]

const DASHBOARDS = [
  {
    name: '📊 Funnel & Onboarding Analytics',
    description: 'Conversion funnels and onboarding performance overview',
    tags: ['analytics', 'funnels', 'onboarding'],
  },
  {
    name: '📈 Conversion Optimization',
    description: 'Cart, checkout, and purchase conversion trends',
    tags: ['analytics', 'conversion', 'checkout'],
  },
  {
    name: '🗺️ User Journey Paths',
    description: 'How users navigate through the app',
    tags: ['analytics', 'paths', 'ux'],
  },
  {
    name: '👥 Audience Cohorts',
    description: 'Segmented user cohorts for targeting and analysis',
    tags: ['analytics', 'cohorts', 'segments'],
  },
]

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🚀 PostHog Insights Setup — Project ${POSTHOG_PROJECT_ID}\n`)

  const dashboardIds = {}
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  const skipIfExists = process.env.POSTHOG_SKIP_IF_EXISTS !== 'false' // Default: skip if exists

  // 1. Create or find dashboards
  console.log('─── Setting up Dashboards ───')
  for (const d of DASHBOARDS) {
    try {
      if (skipIfExists) {
        const existing = await findExisting(d.name, 'dashboard')
        if (existing) {
          dashboardIds[d.name] = existing.id
          console.log(`  ⏭️  Dashboard exists: "${d.name}" (id: ${existing.id})`)
          continue
        }
      }
      const result = await api('POST', '/dashboards/', d)
      if (result) {
        dashboardIds[d.name] = result.id
        console.log(`  ✅ Dashboard created: "${d.name}" (id: ${result.id})`)
      } else {
        console.log(`  ⏭️  Dashboard already exists: "${d.name}"`)
      }
    } catch (err) {
      console.error(`  ❌ Dashboard "${d.name}": ${err.message}`)
    }
  }

  const funnelDashId = dashboardIds['📊 Funnel & Onboarding Analytics']
  const conversionDashId = dashboardIds['📈 Conversion Optimization']
  const pathsDashId = dashboardIds['🗺️ User Journey Paths']

  // 2. Create or find funnels
  console.log('\n─── Setting up Funnels ───')
  for (const f of FUNNELS) {
    try {
      if (skipIfExists) {
        const existing = await findExisting(f.name, 'insight')
        if (existing) {
          console.log(`  ⏭️  Funnel exists: "${f.name}" (id: ${existing.id})`)
          continue
        }
      }
      const result = await api('POST', '/insights/', { name: f.name, description: f.description, query: f.query, dashboards: funnelDashId ? [funnelDashId] : [] })
      if (result) {
        console.log(`  ✅ Funnel created: "${f.name}" (id: ${result.id})`)
      } else {
        console.log(`  ⏭️  Funnel already exists: "${f.name}"`)
      }
    } catch (err) {
      console.error(`  ❌ Funnel "${f.name}": ${err.message}`)
    }
  }

  // 3. Create or find trends
  console.log('\n─── Setting up Trends ───')
  for (const t of TRENDS) {
    try {
      if (skipIfExists) {
        const existing = await findExisting(t.name, 'insight')
        if (existing) {
          console.log(`  ⏭️  Trend exists: "${t.name}" (id: ${existing.id})`)
          continue
        }
      }
      const result = await api('POST', '/insights/', { name: t.name, description: t.description, query: t.query, dashboards: conversionDashId ? [conversionDashId] : [] })
      if (result) {
        console.log(`  ✅ Trend created: "${t.name}" (id: ${result.id})`)
      } else {
        console.log(`  ⏭️  Trend already exists: "${t.name}"`)
      }
    } catch (err) {
      console.error(`  ❌ Trend "${t.name}": ${err.message}`)
    }
  }

  // 4. Create or find paths
  console.log('\n─── Setting up Paths ───')
  for (const p of PATHS) {
    try {
      if (skipIfExists) {
        const existing = await findExisting(p.name, 'insight')
        if (existing) {
          console.log(`  ⏭️  Path exists: "${p.name}" (id: ${existing.id})`)
          continue
        }
      }
      const result = await api('POST', '/insights/', { name: p.name, description: p.description, query: p.query, dashboards: pathsDashId ? [pathsDashId] : [] })
      if (result) {
        console.log(`  ✅ Path created: "${p.name}" (id: ${result.id})`)
      } else {
        console.log(`  ⏭️  Path already exists: "${p.name}"`)
      }
    } catch (err) {
      console.error(`  ❌ Path "${p.name}": ${err.message}`)
    }
  }

  // 5. Create or find cohorts
  console.log('\n─── Setting up Cohorts ───')
  for (const c of COHORTS) {
    try {
      if (skipIfExists) {
        const existing = await findExisting(c.name, 'cohort')
        if (existing) {
          console.log(`  ⏭️  Cohort exists: "${c.name}" (id: ${existing.id})`)
          continue
        }
      }
      const result = await api('POST', '/cohorts/', c)
      if (result) {
        console.log(`  ✅ Cohort created: "${c.name}" (id: ${result.id})`)
      } else {
        console.log(`  ⏭️  Cohort already exists: "${c.name}"`)
      }
    } catch (err) {
      console.error(`  ❌ Cohort "${c.name}": ${err.message}`)
    }
  }

  console.log('\n✅ Setup complete!\n')
  console.log('Next steps:')
  console.log('  1. Visit https://app.posthog.com to review your dashboards')
  console.log('  2. Set up real-time alerts: Alerts → New Alert for each funnel')
  console.log('  3. Configure session replay masks in PostHog Settings')
  console.log('  4. Create heatmaps for: /shop/experience, /shop/cart, /collector/welcome')
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
