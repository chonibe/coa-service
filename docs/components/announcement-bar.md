# AnnouncementBar Component

A reusable, full-width announcement bar component for displaying important status messages and action prompts across the application. **Now with collapsible markers** - dismiss bars and reopen them with a single click!

## Features

- ✅ **Full-width, edge-to-edge** display
- ✅ **5 variants**: info, warning, success, error, pending
- ✅ **Customizable actions**: Single or multiple action buttons
- ✅ **Auto-triggered by status**: Buttons can be conditionally enabled/disabled based on completion state
- ✅ **Collapsible with markers**: Dismiss to a small marker that can be clicked to reopen
- ✅ **3 marker positions**: Top bar, bottom bar, or floating button
- ✅ **Persistent state**: Uses localStorage to remember collapsed state
- ✅ **Responsive**: Adapts to all screen sizes
- ✅ **Accessible**: Proper ARIA attributes and semantic HTML

## Location

- Component: `components/ui/announcement-bar.tsx`
- Exported from: `components/ui/index.ts`

## Usage

### Basic Example

```tsx
import { AnnouncementBar } from "@/components/ui"

<AnnouncementBar
  variant="info"
  message="Welcome to the platform! Complete your profile to get started."
/>
```

### With Action Button

```tsx
<AnnouncementBar
  variant="warning"
  message="Your profile is incomplete. Please add your business information."
  action={{
    label: "Complete Profile",
    onClick: () => router.push("/settings")
  }}
/>
```

### Multiple Actions

```tsx
<AnnouncementBar
  variant="success"
  message="Your payment is ready to process!"
  action={[
    {
      label: "Review",
      onClick: () => setShowReview(true)
    },
    {
      label: "Process Now",
      onClick: handleProcess,
      loading: isProcessing
    }
  ]}
/>
```

### Conditional Display Based on Completion Status

```tsx
// Example: Profile completion
const profileComplete = user?.name && user?.email && user?.paypal_email
const taxInfoComplete = user?.tax_info_submitted

{!profileComplete && (
  <AnnouncementBar
    variant="warning"
    message="Complete your profile to access all features"
    action={{
      label: "Go to Profile",
      onClick: () => router.push("/settings/profile")
    }}
  />
)}

{profileComplete && !taxInfoComplete && (
  <AnnouncementBar
    variant="info"
    message="One more step! Submit your tax information to receive payments."
    action={{
      label: "Submit Tax Info",
      onClick: () => router.push("/settings/tax")
    }}
  />
)}

{profileComplete && taxInfoComplete && (
  <AnnouncementBar
    variant="success"
    message="Your account is fully set up! 🎉"
  />
)}
```

### With Dismiss Functionality

```tsx
import { AnnouncementBar, useAnnouncementBar } from "@/components/ui"

function MyComponent() {
  const { isDismissed, dismiss } = useAnnouncementBar("welcome-banner")

  if (isDismissed) return null

  return (
    <AnnouncementBar
      variant="info"
      message="New feature: You can now export your data!"
      dismissible
      onDismiss={dismiss}
    />
  )
}
```

### Collapsible with Marker (NEW! 🎉)

The bar can be dismissed and collapsed into a clickable marker that reopens it:

```tsx
// Collapses to a top bar marker
<AnnouncementBar
  id="payout-warning"
  variant="warning"
  message="Complete your payout details"
  action={{ label: "Go to Settings", onClick: goToSettings }}
  dismissible
  markerLabel="Setup Required"
  markerPosition="top"
/>

// Collapses to a floating button (bottom-right)
<AnnouncementBar
  id="new-feature"
  variant="info"
  message="Check out our new analytics dashboard!"
  action={{ label: "View Now", onClick: viewDashboard }}
  dismissible
  markerLabel="New Feature"
  markerPosition="floating"
/>

// Collapses to a bottom bar marker
<AnnouncementBar
  id="system-update"
  variant="info"
  message="System maintenance scheduled for tonight"
  dismissible
  markerLabel="Maintenance Notice"
  markerPosition="bottom"
/>
```

**How it works:**
1. User clicks the X button to dismiss
2. Bar collapses into a small marker (top bar, bottom bar, or floating button)
3. Click the marker to expand the full announcement again
4. State persists in localStorage using the `id` prop
```

### Conditional Button States

```tsx
const isEligible = amount >= 25
const hasPayPal = !!user?.paypal_email
const canProcess = isEligible && hasPayPal

<AnnouncementBar
  variant={canProcess ? "success" : "warning"}
  message={
    !hasPayPal 
      ? "Add PayPal email to receive payments"
      : !isEligible
      ? `You need $${(25 - amount).toFixed(2)} more to withdraw`
      : `You have $${amount.toFixed(2)} ready to withdraw`
  }
  action={{
    label: !hasPayPal ? "Add PayPal" : "Request Payment",
    onClick: !hasPayPal ? goToSettings : handlePayout,
    disabled: !canProcess || isProcessing,
    loading: isProcessing
  }}
/>
```

## API Reference

### AnnouncementBarProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | Optional | Unique ID for persistence (required for collapsible) |
| `variant` | `"info" \| "warning" \| "success" \| "error" \| "pending"` | Required | Determines color scheme and default icon |
| `message` | `string \| ReactNode` | Required | Main message content |
| `action` | `AnnouncementBarAction \| AnnouncementBarAction[]` | Optional | Action button(s) |
| `icon` | `ReactNode` | Optional | Custom icon (overrides variant default) |
| `dismissible` | `boolean` | `false` | Whether bar can be collapsed to a marker |
| `onDismiss` | `() => void` | Optional | Callback when collapsed |
| `onReopen` | `() => void` | Optional | Callback when reopened from marker |
| `markerLabel` | `string` | Auto | Text for collapsed marker (auto-generated if not provided) |
| `markerPosition` | `"top" \| "bottom" \| "floating"` | `"top"` | Position of marker when collapsed |
| `className` | `string` | Optional | Additional CSS classes |
| `compact` | `boolean` | `false` | Smaller padding for compact display |
| `initiallyCollapsed` | `boolean` | `false` | Start in collapsed state |

### AnnouncementBarAction

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Button text |
| `onClick` | `() => void` | Click handler |
| `disabled` | `boolean` | Whether button is disabled |
| `loading` | `boolean` | Shows loading spinner |

### useAnnouncementBar Hook

```tsx
const { isDismissed, dismiss, reset } = useAnnouncementBar("unique-storage-key")
```

| Return | Type | Description |
|--------|------|-------------|
| `isDismissed` | `boolean` | Whether bar is dismissed |
| `dismiss` | `() => void` | Dismiss the bar |
| `reset` | `() => void` | Reset dismiss state |

## Variants

### Info (Blue)
Used for informational messages, tips, or neutral announcements.

### Warning (Amber/Orange)
Used for incomplete actions, missing information, or required steps.

### Success (Green)
Used for completed actions, successful states, or positive CTAs.

### Error (Red)
Used for errors, failures, or critical issues requiring attention.

### Pending (Blue)
Used for ongoing processes or waiting states.

## Real-World Examples

### Vendor Payouts Page (with collapsible markers)
See: `app/vendor/dashboard/payouts/page.tsx`

```tsx
// Missing prerequisites - collapses to "Setup Required" marker
<AnnouncementBar
  id="payouts-prerequisites"
  variant="warning"
  message="Complete your payout details to request payments • Missing: profile information"
  action={{
    label: "Go to Settings",
    onClick: () => window.location.href = "/vendor/dashboard/settings"
  }}
  dismissible
  markerLabel="Setup Required"
  markerPosition="top"
/>

// Below minimum threshold - collapses to "Pending Balance" marker
<AnnouncementBar
  id="payouts-minimum"
  variant="pending"
  message="You have $12.50 pending • Minimum payout is $25 • You need $12.50 more"
  dismissible
  markerLabel="Pending Balance"
  markerPosition="top"
/>

// Ready to request - collapses to "Payment Ready" marker
<AnnouncementBar
  id="payouts-ready"
  variant="success"
  icon={<Wallet className="h-5 w-5" />}
  message="You have $150.00 ready to withdraw from 5 orders"
  action={{
    label: "Request Payment",
    onClick: handleRedeem,
    loading: isProcessing
  }}
  dismissible
  markerLabel="Payment Ready"
  markerPosition="top"
/>
```

### Onboarding Flow

```tsx
const steps = {
  profile: user?.profile_complete,
  verification: user?.verified,
  payment: user?.payment_setup
}

const currentStep = !steps.profile ? "profile" 
  : !steps.verification ? "verification"
  : !steps.payment ? "payment"
  : "complete"

{currentStep === "profile" && (
  <AnnouncementBar
    variant="warning"
    message="Step 1 of 3: Complete your profile"
    action={{ label: "Start", onClick: () => router.push("/onboarding/profile") }}
  />
)}

{currentStep === "verification" && (
  <AnnouncementBar
    variant="info"
    message="Step 2 of 3: Verify your identity"
    action={{ label: "Continue", onClick: () => router.push("/onboarding/verify") }}
  />
)}

{currentStep === "payment" && (
  <AnnouncementBar
    variant="info"
    message="Step 3 of 3: Set up payment method"
    action={{ label: "Finish Setup", onClick: () => router.push("/onboarding/payment") }}
  />
)}

{currentStep === "complete" && (
  <AnnouncementBar
    variant="success"
    message="Your account is fully set up!"
    dismissible
    onDismiss={() => localStorage.setItem("onboarding-complete", "true")}
  />
)}
```

## Best Practices

1. **Use appropriate variants**: Match the variant to the message urgency and type
2. **Keep messages concise**: One-line messages work best
3. **Clear CTAs**: Action buttons should have clear, actionable labels
4. **Conditional logic**: Show the right message for the right state
5. **Don't overuse**: Only one announcement bar per page is recommended
6. **Use dismissible for non-critical**: Make bars collapsible if users might want to focus on content
7. **Provide unique IDs**: Always provide an `id` prop when using `dismissible` for proper persistence
8. **Choose marker position wisely**: 
   - `top`: Best for important, page-specific announcements
   - `floating`: Best for global notifications that follow the user
   - `bottom`: Best for less urgent, informational messages

## Marker Positions Explained

### Top Marker (`markerPosition="top"`)
Collapses to a slim bar at the top of the content area. Good for:
- Page-specific announcements
- Action-required notifications
- Status updates relevant to current page

### Floating Marker (`markerPosition="floating"`)
Collapses to a circular button in the bottom-right corner. Good for:
- Global notifications
- New feature announcements
- Non-urgent system messages

### Bottom Marker (`markerPosition="bottom"`)
Collapses to a slim bar at the bottom of the content area. Good for:
- Informational messages
- Optional tips
- Less urgent updates

## Version History

- **v2.0.0** (2026-02-01): Added collapsible markers with 3 position options and localStorage persistence
- **v1.0.0** (2026-02-01): Initial release with full-width layout and 5 variants
