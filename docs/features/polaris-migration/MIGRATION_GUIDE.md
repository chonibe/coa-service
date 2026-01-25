# Polaris Web Components Migration Guide

## Overview

This document provides guidance for migrating from Shadcn UI to Polaris Web Components across the Street Collector application.

## Infrastructure Complete ✅

The following infrastructure has been set up:

1. **Polaris Packages Installed**
   - `@shopify/polaris-tokens`
   - `@shopify/polaris-types`
   - `@shopify/polaris-icons`

2. **React Wrapper Components Created**
   - All core components (Button, Card, Input, Dialog, Badge, Select, Table, Tabs, Alert)
   - All form components (TextField, Checkbox, Radio, Switch, Textarea)
   - All layout components (Stack, Grid, Page, Layout, Navigation)
   - All advanced components (DataTable, Autocomplete, DatePicker, Modal, Sheet)

3. **Backward-Compatible Exports**
   - `components/ui/index.ts` exports Polaris wrappers with same names as Shadcn components
   - Existing imports should work with minimal changes

4. **Configuration**
   - Next.js configured for web components
   - Polaris CSS loaded via CDN
   - CSP updated to allow Shopify CDN

## Migration Pattern

### Step 1: Update Imports

Change imports from:
```typescript
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
```

To:
```typescript
import { Card, CardContent, Button } from "@/components/ui"
```

### Step 2: Update Component Props

Polaris components may have different prop names. Common changes:

- `variant="destructive"` → `tone="critical"` (for Alert/Banner)
- `size="sm"` → `size="small"` or `size="slim"`
- Some className-based styling may need adjustment

### Step 3: Test Components

Test each migrated component to ensure:
- Visual appearance matches Polaris design system
- Functionality works correctly
- Events fire properly
- Accessibility is maintained

## Component Mapping

| Shadcn Component | Polaris Component | Notes |
|-----------------|-------------------|-------|
| Button | p-button | Variants: primary, secondary, tertiary, plain, destructive |
| Card | p-card | Sub-components: CardHeader, CardTitle, etc. work as before |
| Input | p-text-field | Same props, but web component |
| Dialog | p-dialog | Same API |
| Badge | p-badge | Tone instead of variant |
| Select | p-select | Options passed as prop array |
| Table | p-data-table | Headings and rows as props |
| Tabs | p-tabs | Tabs array as prop |
| Alert | p-banner | Tone instead of variant |

## Files Requiring Migration

### Vendor Portal (~40 files)
- `app/vendor/dashboard/page.tsx` ✅ (imports updated)
- `app/vendor/dashboard/products/page.tsx`
- `app/vendor/dashboard/series/page.tsx`
- All other vendor dashboard pages

### Admin Portal (~60 files)
- `app/admin/page.tsx`
- `app/admin/admin-shell.tsx`
- All CRM components
- Warehouse management pages
- Vendor management pages

### Collector Portal (~30 files)
- `app/collector/dashboard/page.tsx`
- `app/collector/artwork/[id]/page.tsx`
- `app/dashboard/[customerId]/page.tsx`

### Public Pages (~10 files)
- `app/certificate/[lineItemId]/page.tsx`
- `app/pages/authenticate/page.tsx`
- `app/login/page.tsx`
- `app/signup/page.tsx`

## Testing Checklist

For each migrated page:
- [ ] Visual appearance matches Polaris design
- [ ] All interactive elements work
- [ ] Forms submit correctly
- [ ] Navigation works
- [ ] Responsive design works
- [ ] Dark mode works (if applicable)
- [ ] Accessibility (keyboard navigation, screen readers)

## Known Limitations

1. **Styling**: Polaris web components use their own CSS. Custom Tailwind classes may not apply directly.
2. **Events**: Some event handlers may need adjustment for web component events.
3. **Icons**: Lucide icons still work, but Polaris icons are available via `@shopify/polaris-icons`.

## Next Steps

1. Systematically migrate each portal starting with Vendor Dashboard
2. Test thoroughly after each migration
3. Update custom components to use Polaris
4. Remove old Shadcn components after migration complete
5. Update documentation

## Support

For Polaris Web Components documentation:
- [Shopify Polaris Web Components Docs](https://shopify.dev/docs/api/app-home/polaris-web-components)
