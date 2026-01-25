# Error Handling - Quick Reference Guide

## TL;DR

Wrap your components with error boundaries to prevent crashes. Use `SectionErrorBoundary` for major sections and `ComponentErrorBoundary` for individual components.

## Import

```typescript
import { SectionErrorBoundary, ComponentErrorBoundary } from '@/components/error-boundaries'
import { SafeIcon } from '@/components/safe-icon'
```

## Basic Usage

### Section (Tab, Card, Panel)
```typescript
<SectionErrorBoundary sectionName="User Profile">
  <ProfileCard />
</SectionErrorBoundary>
```

### Component (Small, Optional)
```typescript
<ComponentErrorBoundary componentName="Avatar" fallbackMode="silent">
  <UserAvatar />
</ComponentErrorBoundary>
```

### Icon
```typescript
<SafeIcon name="Image" fallbackIcon="Circle" className="h-4 w-4" />
```

## Fallback Modes

| Mode | When to Use | What It Shows |
|------|-------------|---------------|
| `silent` | Non-critical, decorative | Nothing (or tiny dot in dev) |
| `minimal` | Optional features | Small placeholder box |
| `custom` | Specific needs | Your custom component |

## Decision Tree

```
Is it a major page section (tab, card, panel)?
├─ YES → Use SectionErrorBoundary
└─ NO → Is it critical to the page?
    ├─ YES → Use ComponentErrorBoundary with minimal mode
    └─ NO → Use ComponentErrorBoundary with silent mode
```

## Common Patterns

### Tab Content
```typescript
<TabsContent value="profile">
  <SectionErrorBoundary sectionName="Profile">
    <ProfileContent />
  </SectionErrorBoundary>
</TabsContent>
```

### Card with Multiple Components
```typescript
<SectionErrorBoundary sectionName="Dashboard Stats">
  <Card>
    <CardContent>
      <ComponentErrorBoundary componentName="Chart" fallbackMode="minimal">
        <StatsChart />
      </ComponentErrorBoundary>
      <ComponentErrorBoundary componentName="Summary" fallbackMode="minimal">
        <StatsSummary />
      </ComponentErrorBoundary>
    </CardContent>
  </Card>
</SectionErrorBoundary>
```

### Modal/Dialog
```typescript
<ComponentErrorBoundary componentName="SettingsModal" fallbackMode="silent">
  <SettingsModal />
</ComponentErrorBoundary>
```

### Layout Components
```typescript
<ComponentErrorBoundary componentName="Sidebar" fallbackMode="silent">
  <Sidebar />
</ComponentErrorBoundary>
```

## Props Reference

### SectionErrorBoundary
```typescript
<SectionErrorBoundary
  sectionName="Section Name"        // Optional: for logging & display
  fallback={<CustomFallback />}     // Optional: custom fallback
  onError={(error) => {}}           // Optional: custom handler
  className="custom-class"          // Optional: CSS classes
  showIcon={true}                   // Optional: show icon (default: true)
>
  {children}
</SectionErrorBoundary>
```

### ComponentErrorBoundary
```typescript
<ComponentErrorBoundary
  componentName="Component Name"    // Optional: for logging
  fallbackMode="silent"             // Optional: 'silent' | 'minimal' | 'custom'
  fallback={<CustomFallback />}     // Optional: custom fallback
  onError={(error) => {}}           // Optional: custom handler
  className="custom-class"          // Optional: CSS classes
>
  {children}
</ComponentErrorBoundary>
```

### SafeIcon
```typescript
<SafeIcon
  name="IconName"                   // Required: lucide-react icon name
  fallbackIcon="Circle"             // Optional: fallback icon (default: 'Circle')
  className="h-4 w-4"              // Optional: CSS classes
  // ... all other lucide-react props
/>
```

## Error Logging

```typescript
import { errorLogger } from '@/lib/error-logging'

// In your error handler
errorLogger.logComponentError(error, 'ComponentName', {
  customContext: 'value'
})
```

## Testing

### Simulate Error
```typescript
// Add to component for testing
if (process.env.NODE_ENV === 'development' && testError) {
  throw new Error('Test error')
}
```

### Check Console
Errors are logged with:
- Component name
- Error message
- Stack trace
- Context (pathname, timestamp, etc.)

## Common Mistakes

### ❌ Don't Do This
```typescript
// Missing error boundary
<ProfileCard />

// Wrong boundary type
<ComponentErrorBoundary>
  <EntirePageContent />  // Use SectionErrorBoundary!
</ComponentErrorBoundary>

// Direct icon import (can crash)
import { Image as ImageIcon } from 'lucide-react'
<ImageIcon />  // Use SafeIcon instead!
```

### ✅ Do This
```typescript
// Proper error boundary
<SectionErrorBoundary sectionName="Profile">
  <ProfileCard />
</SectionErrorBoundary>

// Correct boundary type
<SectionErrorBoundary sectionName="Page Content">
  <EntirePageContent />
</SectionErrorBoundary>

// Safe icon usage
import { SafeIcon } from '@/components/safe-icon'
<SafeIcon name="Image" />
```

## Checklist for New Pages

- [ ] Import error boundaries
- [ ] Wrap each tab content with SectionErrorBoundary
- [ ] Wrap optional components with ComponentErrorBoundary (silent)
- [ ] Wrap critical components with ComponentErrorBoundary (minimal)
- [ ] Replace direct icon imports with SafeIcon
- [ ] Test error scenarios
- [ ] Check error logging in console

## When in Doubt

1. **More boundaries = better** - It's okay to have "too many"
2. **Start with silent mode** - You can always make it more visible
3. **Name everything** - Set `componentName` or `sectionName` for debugging
4. **Test early** - Simulate errors during development

## Need Help?

- Full docs: `docs/features/error-handling/README.md`
- Examples: Check `app/vendor/dashboard/profile/page.tsx`
- Questions: Ask the team!

---

**Quick Links:**
- [Full Documentation](./README.md)
- [Changelog](./CHANGELOG.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
