# Street Collector Design System

## Overview
Our design system is built using Shadcn/UI, providing a consistent, accessible, and highly customizable component library.

## Core Principles
- Consistency
- Accessibility
- Flexibility
- Performance

## Color Palette
### Base Colors
- Primary: `slate-900` / `slate-50`
- Secondary: `amber-500` / `amber-400`
- Accent: `green-500` / `green-400`

### Semantic Colors
- Success: `green-500`
- Warning: `yellow-500`
- Error: `red-500`
- Info: `blue-500`

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
### Button
- Variants: Primary, Secondary, Outline, Ghost
- Sizes: xs, sm, md, lg
- States: Default, Hover, Active, Disabled

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

## Version
- Design System Version: 1.0.0
- Last Updated: ${new Date().toISOString()} 