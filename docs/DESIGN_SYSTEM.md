# Street Collector Design System

## Overview
Our design system is built using **Shopify Polaris Web Components** with React wrapper components. This provides a consistent, accessible, and professional UI that aligns with Shopify's design language while maintaining flexibility for our application needs.

## Core Principles
- **Polaris Design Language**: All components follow Shopify Polaris design guidelines
- **Accessibility**: WCAG 2.1 AA compliant (built into Polaris)
- **Performance**: Web components with efficient rendering
- **Consistency**: Unified component API across the application
- **Type Safety**: Full TypeScript support for all components

## Design Language

### Polaris Components
All UI components are built on Shopify Polaris Web Components:
- **Web Components**: Native browser components for optimal performance
- **React Wrappers**: Seamless React integration via wrapper components
- **Design Tokens**: Consistent spacing, colors, and typography from Polaris
- **Responsive**: Mobile-first design with breakpoint system

### Component Architecture
- **Base Components**: Polaris web components (`p-button`, `p-card`, etc.)
- **React Wrappers**: Located in `components/polaris/`
- **Exports**: Backward-compatible exports in `components/ui/index.ts`

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
- **Props**: `open`, `title`, `size` (`small`, `medium`, `large`, `fullWidth`)
- **Events**: `onClose` callback

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
- **Props**: `tabs` (array), `selected` (index)
- **Events**: `onSelect`

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

## Performance Considerations
- Minimal CSS overhead
- No runtime dependencies
- Tree-shakeable components

## Implementation Notes
- Web components loaded via CDN for optimal performance
- React wrappers provide seamless integration
- TypeScript definitions ensure type safety
- Polaris design tokens available via `@shopify/polaris-tokens`

## Implementation

### Component Usage
All Polaris components are available through backward-compatible exports:
```typescript
// Import from unified export
import { Button, Card, Input } from '@/components/ui'

// Or import directly from Polaris wrappers
import { PolarisButton } from '@/components/polaris/polaris-button'
```

### Styling
- Polaris components use their own CSS (loaded via CDN)
- Custom styling via `className` prop (may have limitations)
- Use Polaris design tokens for consistent spacing/colors

### Design Tokens
Import Polaris design tokens:
```typescript
import { tokens } from '@shopify/polaris-tokens'

// Access tokens
const spacing = tokens.space
const colors = tokens.color
```

## Migration from Shadcn UI

See [Polaris Migration Guide](/docs/features/polaris-migration/MIGRATION_GUIDE.md) for detailed migration instructions.

## Version
- Design System Version: 3.0.0 (Polaris Web Components)
- Last Updated: 2025-01-25
- Breaking Changes: Migrated from Shadcn UI to Polaris Web Components 