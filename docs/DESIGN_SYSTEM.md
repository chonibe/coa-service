# Street Collector Design System

## Overview
Our design system is built using Shadcn/UI with a unified glassmorphism and gradient design language. All components automatically inherit consistent styling, ensuring a cohesive experience throughout the application.

## Core Principles
- **Unified Design**: All components inherit design system styles automatically
- **Glassmorphism**: Consistent backdrop blur and transparency effects
- **Gradient Accents**: Blue-to-indigo gradients for primary actions
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Minimal CSS overhead with Tailwind utilities

## Design Language

### Glassmorphism
All cards, alerts, and containers use glassmorphism by default:
- **Cards**: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl`
- **Containers**: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm`
- **Hover States**: `hover:bg-white/50 dark:hover:bg-slate-900/50 backdrop-blur-sm`

### Gradients
- **Primary Actions**: `bg-gradient-to-r from-blue-600 to-indigo-600`
- **Text Headings**: `bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`
- **Success Actions**: `bg-gradient-to-r from-green-600 to-emerald-600`

## Color Palette
### Base Colors
- Primary: `blue-600` to `indigo-600` (gradient)
- Secondary: `slate-900` / `slate-50`
- Accent: `purple-600` to `pink-600` (gradient)

### Semantic Colors
- Success: `green-600` to `emerald-600` (gradient)
- Warning: `yellow-500`
- Error: `red-500`
- Info: `blue-500`

### Chart Colors
- Primary: `#3b82f6` (blue-500)
- Secondary: `#6366f1` (indigo-500)
- Accent: `#8b5cf6` (purple-500)

## Typography
### Font Families
- Primary: Inter
- Monospace: JetBrains Mono

### Type Scale
- Base: 16px
- Headings: Scaled proportionally
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

### Button (Unified)
All buttons automatically use the design system:
- **Default**: Gradient blue-to-indigo with shadow
- **Outline**: Glassmorphism with backdrop blur
- **Ghost**: Subtle hover with backdrop blur
- **Sizes**: xs, sm, md, lg, icon
- **States**: Automatic hover/active/disabled states

### Card (Unified)
All cards automatically use glassmorphism:
- Background: `bg-white/80 dark:bg-slate-900/80`
- Backdrop: `backdrop-blur-xl`
- Border: `border-0` (no border, shadow provides depth)
- Shadow: `shadow-xl`

### Alert (Unified)
All alerts automatically use glassmorphism:
- Same styling as cards
- Destructive variant maintains red accent colors

### Input (Unified)
All inputs automatically use glassmorphism:
- Background: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm`
- Consistent focus states

### Select/Dropdown (Unified)
All selects automatically use glassmorphism:
- Trigger: Glassmorphism background
- Content: `bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl`

### Tabs (Unified)
All tabs automatically use glassmorphism:
- TabsList: Glassmorphism background
- Active tab: Enhanced background with shadow

### Input
- Variants: Default, Bordered, Underlined
- States: Default, Focus, Error, Disabled

### Dialog
- Animations: Smooth enter/exit
- Backdrop: Blurred overlay
- Positioning: Centered

## Accessibility
- WCAG 2.1 AA Compliance
- Keyboard Navigation
- Screen Reader Support
- High Contrast Mode

## Dark/Light Mode
- Seamless theme switching
- Persistent theme preference
- System theme detection

## Performance Considerations
- Minimal CSS overhead
- No runtime dependencies
- Tree-shakeable components

## Implementation Notes
- Use CSS variables for theming
- Leverage Tailwind's utility classes
- Prefer composition over inheritance

## Implementation

### Automatic Application
All UI components in `components/ui/` automatically inherit the unified design system. No manual class additions needed.

### Manual Override
If you need to override the default styles, you can still pass `className` props which will merge with the base styles.

### Design Tokens
Import design tokens from `lib/design-system.ts`:
```typescript
import { getGlassmorphism, getGradient, getChartColor } from "@/lib/design-system"

// Use in custom components
<div className={getGlassmorphism("card")}>
<div className={getGradient("primary")}>
```

## Version
- Design System Version: 2.0.0 (Unified)
- Last Updated: 2025-01-23
- Breaking Changes: All components now use glassmorphism by default 