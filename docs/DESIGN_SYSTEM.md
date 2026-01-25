# Street Collector Design System

## Overview
Our design system uses **React components** styled with Tailwind CSS and Polaris-inspired design tokens. Components follow the Shopify Polaris design language while rendering native HTML elements for consistency, accessibility, and compatibility with our Next.js application.

## Core Principles
- **Polaris Design Language**: All components follow Shopify Polaris design guidelines
- **Accessibility**: WCAG 2.1 AA compliant patterns (focus, ARIA, keyboard)
- **Performance**: Native HTML + Tailwind; no custom element runtime
- **Consistency**: Unified component API via `@/components/ui`
- **Type Safety**: Full TypeScript support for all components

## Design Language

### Component Architecture
- **React Components**: Styled with Tailwind and CSS variables (`--p-color-*`, `--p-space-*`, `--p-border-radius-*`)
- **Location**: `components/polaris/`
- **Exports**: Backward-compatible exports in `components/ui/index.ts`
- **No web components**: All UI uses standard HTML elements (e.g. `button`, `div`, `input`)

## Color Palette
Polaris uses a semantic color system:

### Base Colors
- **Primary**: Polaris primary blue
- **Secondary**: Polaris secondary gray
- **Surface**: Polaris surface colors

### Semantic Colors (Tones)
- **Info**: Blue tones for informational content
- **Success**: Green tones for success states
- **Warning**: Yellow/orange tones for warnings
- **Critical**: Red tones for errors and destructive actions

### Design Tokens
Import Polaris design tokens from `@shopify/polaris-tokens`:
```typescript
import { tokens } from '@shopify/polaris-tokens'
```

## Typography
### Font Families
- **Headings/Titles**: Fraunces (serif) - Elegant, sophisticated serif font for all headings
- **Body Text**: Barlow (sans-serif) - Clean, modern sans-serif for all body text and UI elements
- **Monospace**: JetBrains Mono (for code and technical content)

### Font Usage
- All headings (h1-h6) automatically use Fraunces
- All body text, buttons, inputs, and UI elements use Barlow
- Fonts are loaded from Google Fonts with optimal performance settings

### Type Scale
- Base: 16px (Barlow)
- Headings: Scaled proportionally (Fraunces)
- Line Heights: Optimized for readability

## Spacing System
- Base Unit: 4px
- Scale:
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px

## Component Guidelines

### Using Polaris Components

Import components from the unified export:
```typescript
import { Button, Card, Input, Dialog, Badge } from '@/components/ui'
```

### Button
- **Variants**: `primary`, `secondary`, `tertiary`, `plain`, `destructive`
- **Sizes**: `slim`, `medium`, `large`
- **Props**: `fullWidth`, `disabled`, `loading`, `url`, `external`

### Card
- **Sub-components**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Props**: `background`, `padding`, `roundedAbove`

### Input / TextField
- **Props**: `label`, `helpText`, `error`, `requiredIndicator`, `disabled`, `placeholder`
- **Types**: `text`, `email`, `number`, `password`, `search`, `tel`, `url`
- **Multiline**: Support for textarea via `multiline` prop

### Dialog / Modal
- **Dialog**: Compound component. Use with `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogTrigger`
- **Props**: `open`, `onOpenChange`, `onClose`, `title`, `size` (`small`, `medium`, `large`, `fullWidth`)
- **Modal**: Single component with `open`, `title`, `size`, `onClose`

### Badge
- **Tones**: `info`, `success`, `attention`, `warning`, `critical`
- **Sizes**: `small`, `medium`, `large`

### Alert / Banner
- **Tones**: `info`, `success`, `warning`, `critical`
- **Props**: `title`, `onDismiss`

### Select
- **Props**: `label`, `options` (array of `{value, label}`), `placeholder`
- **Events**: `onChange`

### Table / DataTable
- **Props**: `headings`, `rows`, `columnContentTypes`, `sortable`
- **Events**: `onSort`

### Tabs
- **Compound**: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- **Props**: `value`, `defaultValue`, `onValueChange`; `TabsTrigger`/`TabsContent` use `value`

## Accessibility
- WCAG 2.1 AA Compliance
- Keyboard Navigation
- Screen Reader Support
- High Contrast Mode

## Dark/Light Mode
- **Default Theme**: Light mode (bright, clean interface)
- **Seamless Theme Switching**: Use the `ThemeToggle` component for easy switching
- **Persistent Theme Preference**: User preferences are saved automatically
- **System Theme Detection**: Supports system preference detection
- **Light Mode Features**:
  - Bright white backgrounds with subtle transparency
  - Clear borders and shadows for depth
  - High contrast text for readability
  - Vibrant gradient accents
- **Dark Mode Features**:
  - Deep slate backgrounds
  - Reduced eye strain for low-light environments
  - Maintains all design system consistency

### Theme Toggle Component
Use the `ThemeToggle` component to allow users to switch between light, dark, and system themes:

```typescript
import { ThemeToggle } from "@/components/theme-toggle"

// Add to your navigation or header
<ThemeToggle />
```

## Layout Utilities

### PageContainer
Standardized page wrapper with max-width and padding.
```typescript
import { PageContainer } from '@/components/ui'

<PageContainer maxWidth="7xl" padding="md">
  {children}
</PageContainer>
```
- **maxWidth**: `'4xl' | '5xl' | '6xl' | '7xl' | 'full'`
- **padding**: `'none' | 'sm' | 'md' | 'lg'`

### PageHeader
Consistent page header with title, description, and actions.
```typescript
import { PageHeader } from '@/components/ui'

<PageHeader
  title="Dashboard"
  description="Manage your products and settings"
  actions={<Button>Create</Button>}
/>
```

## Performance Considerations
- Minimal CSS overhead (Tailwind + CSS variables)
- No custom element runtime
- Tree-shakeable components

## Implementation Notes
- Components render native HTML; styling via Tailwind and `app/globals.css` tokens
- TypeScript definitions for all components
- Use `--p-*` CSS variables for custom styles

## Implementation

### Component Usage
```typescript
import { Button, Card, Input, PageHeader, PageContainer } from '@/components/ui'
import { PolarisButton } from '@/components/polaris/polaris-button'
```

### Styling
- Tailwind classes; Polaris tokens via `var(--p-color-*)`, etc.
- `className` prop supported on all components

## Migration from Shadcn UI

See [Polaris Migration Guide](/docs/features/polaris-migration/MIGRATION_GUIDE.md) for detailed migration instructions.

## Version
- Design System Version: 3.1.0 (Polaris-styled React components)
- Last Updated: 2025-01-25
- Architecture: React components with Tailwind + CSS variables; no `p-*` web components