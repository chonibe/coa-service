# Error Handling System

## Overview

The COA Service implements a comprehensive, multi-layered error handling system that prevents component crashes from affecting the entire application. This system provides graceful fallbacks, error logging, and minimal UI disruption when errors occur.

## Architecture

### Three Layers of Protection

1. **Page-Level Error Boundaries** (`app/error.tsx`, `app/vendor/dashboard/error.tsx`)
   - Catches catastrophic errors that affect entire pages
   - Provides recovery options (retry, navigate home)
   - Last line of defense

2. **Section-Level Error Boundaries** (`SectionErrorBoundary`)
   - Wraps major page sections (tabs, cards, panels)
   - Shows minimal "Content unavailable" message
   - Allows rest of page to function normally

3. **Component-Level Error Boundaries** (`ComponentErrorBoundary`)
   - Wraps individual components
   - Silent or minimal fallback modes
   - Prevents small component failures from cascading

## Components

### Core Error Boundaries

#### ComponentErrorBoundary

Catches errors at the component level with configurable fallback modes.

```typescript
import { ComponentErrorBoundary } from '@/components/error-boundaries'

<ComponentErrorBoundary
  componentName="MyComponent"
  fallbackMode="silent" // 'silent' | 'minimal' | 'custom'
  onError={(error) => console.log('Custom error handler', error)}
>
  <MyComponent />
</ComponentErrorBoundary>
```

**Props:**
- `componentName` (optional): Name for logging
- `fallbackMode` (optional): 'silent' | 'minimal' | 'custom'
- `fallback` (optional): Custom fallback React node
- `onError` (optional): Custom error handler function
- `className` (optional): CSS classes for fallback

**Fallback Modes:**
- `silent`: Renders nothing (or tiny debug indicator in dev)
- `minimal`: Shows small placeholder box
- `custom`: Uses provided `fallback` prop

#### SectionErrorBoundary

Catches errors at the section level with more visible fallbacks.

```typescript
import { SectionErrorBoundary } from '@/components/error-boundaries'

<SectionErrorBoundary
  sectionName="User Profile"
  showIcon={true}
>
  <ProfileSection />
</SectionErrorBoundary>
```

**Props:**
- `sectionName` (optional): Name displayed in fallback
- `fallback` (optional): Custom fallback React node
- `onError` (optional): Custom error handler
- `className` (optional): CSS classes for fallback
- `showIcon` (optional): Show icon in fallback (default: true)

#### SafeComponent

HOC wrapper that adds error handling and loading states to any component.

```typescript
import { SafeComponent, withErrorBoundary } from '@/components/error-boundaries'

// As a wrapper component
<SafeComponent
  component={MyComponent}
  componentProps={{ prop1: 'value' }}
  componentName="MyComponent"
  fallbackMode="minimal"
/>

// As an HOC
const SafeMyComponent = withErrorBoundary(MyComponent, {
  componentName: 'MyComponent',
  fallbackMode: 'minimal'
})
```

### Fallback Components

#### SilentFallback

Renders nothing or a tiny debug indicator in development.

```typescript
import { SilentFallback } from '@/components/error-boundaries'

<SilentFallback 
  componentName="MyComponent"
  showDebugIndicator={true} // Only in development
/>
```

#### MinimalFallback

Shows a subtle, unobtrusive placeholder.

```typescript
import { MinimalFallback } from '@/components/error-boundaries'

<MinimalFallback 
  componentName="MyComponent"
  className="my-custom-class"
/>
```

#### SectionFallback

Shows "Content unavailable" message for larger sections.

```typescript
import { SectionFallback } from '@/components/error-boundaries'

<SectionFallback 
  sectionName="User Dashboard"
  showIcon={true}
  className="my-custom-class"
/>
```

### Safe Icon Component

Prevents icon import failures from crashing the application.

```typescript
import { SafeIcon, useSafeIcon, iconExists } from '@/components/safe-icon'

// As a component
<SafeIcon 
  name="ImageIcon" 
  fallbackIcon="Circle"
  className="h-4 w-4"
/>

// As a hook
const Icon = useSafeIcon('ImageIcon', 'Circle')
<Icon className="h-4 w-4" />

// Check if icon exists
if (iconExists('ImageIcon')) {
  // Icon is available
}
```

### Error Logging

Centralized error logging with context capture.

```typescript
import { errorLogger } from '@/lib/error-logging'

// Log component error
errorLogger.logComponentError(error, 'ComponentName', {
  additionalContext: 'value'
})

// Log import error
errorLogger.logImportError(error, 'ModuleName')

// Log API error
errorLogger.logAPIError(error, '/api/endpoint')

// Log runtime error
errorLogger.logRuntimeError(error, { context: 'value' })

// Check if error is recoverable
if (errorLogger.isRecoverableError(error)) {
  // Handle recoverable error
}

// Get user-friendly message
const message = errorLogger.getUserFriendlyMessage(error)
```

## Usage Guidelines

### When to Use Each Boundary

#### Use ComponentErrorBoundary when:
- Wrapping small, self-contained components
- Component failure should be silent or minimal
- Component is optional/non-critical
- Examples: icons, badges, tooltips, small widgets

#### Use SectionErrorBoundary when:
- Wrapping major page sections
- Section contains multiple components
- User should be aware section is unavailable
- Examples: tab content, cards, panels, forms

#### Use Page-Level Error Boundaries when:
- Entire page/route needs protection
- Already provided by Next.js (app/error.tsx)
- Customize for better UX

### Best Practices

1. **Wrap Early, Wrap Often**
   - Add error boundaries during development
   - Don't wait for errors to occur
   - Better to have unused boundaries than missing ones

2. **Choose Appropriate Fallback Mode**
   - `silent`: Non-critical decorative elements
   - `minimal`: Optional features, secondary content
   - `custom`: Critical sections needing specific messaging

3. **Provide Context**
   - Always set `componentName` or `sectionName`
   - Helps with debugging and logging
   - Makes error reports more actionable

4. **Log Strategically**
   - Use custom `onError` handlers for critical components
   - Add additional context to error logs
   - Monitor error patterns in production

5. **Test Error Boundaries**
   - Simulate errors during development
   - Verify fallbacks render correctly
   - Check that page remains functional

## Implementation Examples

### Profile Page

```typescript
<Tabs>
  <TabsContent value="profile">
    <SectionErrorBoundary sectionName="Public Profile">
      <Card>
        <CardContent>
          <ComponentErrorBoundary 
            componentName="ProfileImage" 
            fallbackMode="minimal"
          >
            <ProfileImage />
          </ComponentErrorBoundary>
          
          <ComponentErrorBoundary 
            componentName="ProfileForm" 
            fallbackMode="minimal"
          >
            <ProfileForm />
          </ComponentErrorBoundary>
        </CardContent>
      </Card>
    </SectionErrorBoundary>
  </TabsContent>
</Tabs>
```

### Products Page

```typescript
<div>
  <SectionErrorBoundary sectionName="Artwork Series">
    <SeriesGrid />
  </SectionErrorBoundary>

  <Tabs>
    <TabsContent value="catalog">
      <SectionErrorBoundary sectionName="Artwork Catalog">
        <ProductTable />
      </SectionErrorBoundary>
    </TabsContent>
    
    <TabsContent value="submissions">
      <SectionErrorBoundary sectionName="Submissions">
        <SubmissionsList />
      </SectionErrorBoundary>
    </TabsContent>
  </Tabs>
</div>
```

### Icon Usage

```typescript
// Instead of direct import
import { Image as ImageIcon } from 'lucide-react'
<ImageIcon className="h-4 w-4" />

// Use SafeIcon
import { SafeIcon } from '@/components/safe-icon'
<SafeIcon name="Image" fallbackIcon="Circle" className="h-4 w-4" />
```

## Testing

### Manual Testing

1. **Simulate Component Errors**
   ```typescript
   // Add to component for testing
   if (process.env.NODE_ENV === 'development' && testError) {
     throw new Error('Test error')
   }
   ```

2. **Test Each Boundary Level**
   - Throw error in component → check ComponentErrorBoundary
   - Throw error in section → check SectionErrorBoundary
   - Throw error in page → check page error boundary

3. **Verify Fallback UI**
   - Silent mode shows nothing (or debug indicator)
   - Minimal mode shows subtle placeholder
   - Section mode shows "Content unavailable"

4. **Check Error Logging**
   - Open browser console
   - Verify error details are logged
   - Check context is captured correctly

### Automated Testing

```typescript
import { render } from '@testing-library/react'
import { ComponentErrorBoundary } from '@/components/error-boundaries'

const ThrowError = () => {
  throw new Error('Test error')
}

test('catches component errors', () => {
  const { container } = render(
    <ComponentErrorBoundary fallbackMode="minimal">
      <ThrowError />
    </ComponentErrorBoundary>
  )
  
  // Verify fallback is rendered
  expect(container.querySelector('.min-h-\\[20px\\]')).toBeInTheDocument()
})
```

## Monitoring & Production

### Error Logging in Production

The error logging system is designed to be extended with monitoring services:

```typescript
// lib/error-logging.ts
// TODO: Add production monitoring
// Example with Sentry:
if (process.env.NODE_ENV === 'production') {
  Sentry.captureException(entry.error, {
    tags: {
      errorType: entry.context.errorType,
      severity: entry.context.severity,
    },
    extra: entry.context,
  })
}
```

### Recommended Monitoring Services

- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay with error tracking
- **Datadog**: Full-stack monitoring
- **New Relic**: Application performance monitoring

## Troubleshooting

### Common Issues

#### Error boundary not catching error
- Ensure error is thrown during render (not in event handler)
- Check that boundary wraps the failing component
- Verify boundary is a class component (React requirement)

#### Fallback not rendering
- Check console for boundary errors
- Verify fallback component is valid React node
- Test fallback component in isolation

#### Too many error boundaries
- Consolidate boundaries where appropriate
- Use section boundaries for groups of components
- Reserve component boundaries for critical/unstable components

#### Performance concerns
- Error boundaries have minimal overhead
- Only active when errors occur
- No performance impact in happy path

## Migration Guide

### Adding Error Boundaries to Existing Pages

1. **Import boundaries**
   ```typescript
   import { SectionErrorBoundary, ComponentErrorBoundary } from '@/components/error-boundaries'
   ```

2. **Identify sections**
   - Find major page sections (tabs, cards, panels)
   - Identify critical vs optional components

3. **Wrap sections**
   ```typescript
   <SectionErrorBoundary sectionName="Section Name">
     {/* existing content */}
   </SectionErrorBoundary>
   ```

4. **Wrap critical components**
   ```typescript
   <ComponentErrorBoundary componentName="Component Name" fallbackMode="minimal">
     {/* existing component */}
   </ComponentErrorBoundary>
   ```

5. **Test**
   - Simulate errors
   - Verify fallbacks
   - Check logging

## Related Documentation

- [Component Documentation](../components/)
- [Testing Guide](../testing/)
- [Monitoring Setup](../monitoring/)

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
