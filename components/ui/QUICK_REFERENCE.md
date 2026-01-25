# UI Component Quick Reference

## For Developers: How to Use UI Components

### ✅ Always Do This

```typescript
// ✅ CORRECT: Import from the barrel export
import { Button, Card, Input } from '@/components/ui'

function MyComponent() {
  return (
    <Card>
      <Input label="Email" value={email} onChange={setEmail} />
      <Button variant="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </Card>
  )
}
```

### ❌ Never Do This

```typescript
// ❌ WRONG: Don't import from implementation directories
import { PolarisButton } from '@/components/polaris/polaris-button'
import { Button } from '@/components/ui/button'

// ❌ WRONG: Don't import directly from external libraries
import { Button } from '@shopify/polaris'
import { Button } from '@mui/material'
```

## Why?

The barrel export (`@/components/ui`) is our **abstraction layer**:
- ✅ Makes future migrations easy
- ✅ Provides consistent API across the app
- ✅ Hides implementation details
- ✅ Enables incremental updates

## Available Components

### Core Components
- `Button` - Buttons with various styles
- `Card` - Container with optional header/footer
- `Input` - Text input fields
- `Select` - Dropdown selects
- `Dialog` - Modals and dialogs
- `Badge` - Status badges
- `Alert` - Alert banners

### Form Components
- `Checkbox` - Checkboxes
- `Radio` / `RadioGroup` - Radio buttons
- `Switch` - Toggle switches
- `Textarea` - Multi-line text inputs
- `Label` - Form labels

### Layout Components
- `Tabs` - Tabbed interfaces
- `Table` - Data tables
- `Separator` - Dividers
- `Stack` - Vertical/horizontal stacks
- `Grid` - Grid layouts

### Utility Components
- `Tooltip` - Hover tooltips
- `Skeleton` - Loading skeletons
- `Toast` - Notifications

## Component Interfaces

All components have TypeScript interfaces in `components/ui/interfaces.ts`:

```typescript
import type { ButtonProps } from '@/components/ui/interfaces'

const myButtonProps: ButtonProps = {
  variant: 'primary',
  size: 'medium',
  onClick: handleClick,
  children: 'Click me'
}
```

## Common Patterns

### Form with Validation

```typescript
import { Input, Button, Card } from '@/components/ui'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  
  return (
    <Card>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={error}
        required
      />
      <Button 
        variant="primary" 
        onClick={handleSubmit}
        fullWidth
      >
        Log In
      </Button>
    </Card>
  )
}
```

### Loading States

```typescript
import { Button, Skeleton } from '@/components/ui'

function DataView() {
  const { data, loading } = useData()
  
  if (loading) {
    return <Skeleton variant="rectangular" height={200} />
  }
  
  return (
    <Button loading={loading} onClick={handleSave}>
      Save Changes
    </Button>
  )
}
```

### Toast Notifications

```typescript
import { useToast } from '@/components/ui'

function MyComponent() {
  const toast = useToast()
  
  const handleSuccess = () => {
    toast.success('Changes saved successfully!')
  }
  
  const handleError = () => {
    toast.error('Something went wrong', 5000) // 5 second duration
  }
  
  return <Button onClick={handleSuccess}>Save</Button>
}
```

## Styling

### Using className

All components accept a `className` prop for custom styling:

```typescript
import { Button } from '@/components/ui'

<Button className="mt-4 w-full" variant="primary">
  Submit
</Button>
```

### Design Tokens

Use design tokens for consistent styling:

```typescript
import { tokens } from '@/styles/design-tokens'

const customStyle = {
  backgroundColor: tokens.colors.primary,
  padding: tokens.spacing.md,
  borderRadius: tokens.borderRadius.md,
}
```

## TypeScript Support

All components are fully typed:

```typescript
import type { ButtonProps, InputProps } from '@/components/ui/interfaces'

// Type-safe component props
interface MyFormProps {
  submitButton: ButtonProps
  emailInput: InputProps
}
```

## Migration Guide

If you're migrating from Shadcn/Radix to Polaris:

1. **Imports stay the same** - Just import from `@/components/ui`
2. **Props mostly compatible** - Minor adjustments may be needed
3. **Check interfaces** - See `components/ui/interfaces.ts` for current API

## Useful Scripts

```bash
# Find where a component is used
npm run ui:find-usage Button

# Check migration status
npm run ui:migration-status

# Run visual regression tests
npm run test:visual
```

## Documentation

- 📖 [Migration Strategy](../docs/UI_MIGRATION_STRATEGY.md) - How to migrate UI libraries
- 📦 [Legacy Components](./LEGACY_COMPONENTS.md) - Remaining legacy components
- 🧹 [Cleanup Summary](./CLEANUP_SUMMARY.md) - Recent cleanup details
- 🎨 [Design System](../docs/DESIGN_SYSTEM.md) - Design system guide

## Getting Help

- Check component interfaces: `components/ui/interfaces.ts`
- View examples in Storybook (if available)
- Ask in #frontend-help channel
- See documentation links above

---

**Remember**: Always import from `@/components/ui` 🎯
