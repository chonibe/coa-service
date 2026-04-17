# Legacy UI Components

## Overview
This document lists the remaining Shadcn UI components that are kept alongside Polaris Web Components migration.

## Migration Status
**Migration Completed**: January 2026  
**Polaris Components**: All primary UI components migrated to Polaris Web Components  
**Legacy Components**: Minimal set retained for specialized functionality

## Components Retained

### 1. Command (`command.tsx`)
**Status**: Active - 4 imports  
**Reason**: Command palette pattern (⌘K) not available in Polaris Web Components  
**Dependencies**: `@radix-ui/react-dialog`, `cmdk`  
**Used In**:
- `components/unified-search.tsx`
- `components/crm/global-search.tsx`
- `app/vendor/dashboard/series/components/SmartConditionsBuilder.tsx`
- `app/admin/components/command-palette.tsx`

**Recommendation**: Keep until Polaris provides command palette component

### 2. Calendar (`calendar.tsx`)
**Status**: Active - 2 imports  
**Reason**: Full calendar view (react-day-picker) differs from Polaris DatePicker  
**Dependencies**: `react-day-picker`  
**Used In**:
- `components/vendor/time-range-selector.tsx`
- `components/payouts/advanced-filters.tsx`

**Notes**: 
- Uses `buttonVariants` from Polaris for styling consistency
- Could be migrated to Polaris DatePicker but would require UX changes

**Recommendation**: Keep for now, consider Polaris DatePicker in future

### 3. Form (`form.tsx`)
**Status**: Active - 1 import  
**Reason**: React Hook Form integration wrapper  
**Dependencies**: `react-hook-form`, `@radix-ui/react-label`  
**Used In**:
- `app/admin/settings/backup/backup-settings-form.tsx`

**Notes**: Architectural component that provides form context  
**Recommendation**: Keep as form state management wrapper

### 4. Alert Dialog (`alert-dialog.tsx`)
**Status**: Active - 7 imports  
**Reason**: Confirmation dialog pattern with Cancel/Confirm actions  
**Dependencies**: `@radix-ui/react-alert-dialog`  
**Used In**:
- Various pages requiring explicit user confirmation before destructive actions

**Migration Path**: Could use Polaris Modal with custom confirmation UI  
**Recommendation**: Migrate to Polaris Modal with confirmation pattern

### 5. Components to Migrate to Polaris

The following components still have imports but have Polaris equivalents:

| Component | Imports | Polaris Alternative | Migration Priority |
|-----------|---------|---------------------|-------------------|
| Tooltip | 11 | Polaris Tooltip | High |
| Dropdown Menu | 15 | Polaris ActionList/Popover | High |
| Scroll Area | 14 | Native CSS `overflow-auto` or Polaris Scrollable | Medium |
| Avatar | 9 | Polaris Avatar | High |
| Popover | 5 | Polaris Popover | Medium |
| Accordion | 1 | Polaris Collapsible | Low |

## Components Safe to Remove

The following components have **zero direct imports** and can be safely removed:

### Zero Import Components
- `drawer.tsx` - No imports (Polaris Sheet replaces this)
- `carousel.tsx` - No imports
- `sonner.tsx` - No imports (Polaris Toast replaces this)
- `toaster.tsx` - No imports
- `hover-card.tsx` - Rarely used
- `context-menu.tsx` - Minimal usage
- `menubar.tsx` - Minimal usage
- `navigation-menu.tsx` - Replaced by Polaris Navigation
- `breadcrumb.tsx` - Minimal usage
- `aspect-ratio.tsx` - CSS aspect-ratio property available
- `input-otp.tsx` - Specialized component
- `resizable.tsx` - Specialized component
- `slider.tsx` - Minimal usage
- `toggle.tsx` - Minimal usage
- `toggle-group.tsx` - Minimal usage
- `progress.tsx` - Polaris ProgressBar available
- `chart.tsx` - recharts still used elsewhere

### Replaced by Polaris (in index.ts)
The following components are already replaced by Polaris wrappers via `components/ui/index.ts`:
- `button.tsx` → `PolarisButton`
- `card.tsx` → `PolarisCard`
- `input.tsx` → `PolarisTextField`
- `dialog.tsx` → `PolarisDialog`
- `badge.tsx` → `PolarisBadge`
- `select.tsx` → `PolarisSelect`
- `table.tsx` → `PolarisDataTable`
- `tabs.tsx` → `PolarisTabs`
- `alert.tsx` → `PolarisBanner`
- `checkbox.tsx` → `PolarisCheckbox`
- `radio-group.tsx` → `PolarisRadio`
- `switch.tsx` → `PolarisSwitch`
- `textarea.tsx` → `PolarisTextarea`
- `label.tsx` → `PolarisLabel`
- `separator.tsx` → `PolarisSeparator`
- `skeleton.tsx` → `PolarisSkeleton`
- `sheet.tsx` → `PolarisSheet`

**These can be removed** as all imports go through `@/components/ui` (index.ts) which exports Polaris wrappers.

## Custom/Feature Components

These are not basic UI components but feature-specific implementations:
- `artwork-card.tsx` - Feature component (keep)
- `certificate-modal.tsx` - Feature component (keep)
- ~~`nfc-pairing-wizard.tsx`~~ - Removed 2026-04. Canonical NFC UI is `components/nfc/nfc-auth-sheet.tsx`, triggered from `/collector/artwork/[id]` via the `/api/nfc-tags/redirect` flow.
- `sidebar.tsx` - Layout component using Radix (needs migration to Polaris)
- `pagination.tsx` - Could use Polaris Pagination
- `use-mobile.tsx` - Hook (keep)
- `use-toast.ts` - Hook (keep)

## Cleanup Recommendations

### Immediate Actions
1. **Remove** components that are fully replaced by Polaris (listed above under "Replaced by Polaris")
2. **Remove** zero-import components (listed above under "Zero Import Components")
3. **Keep** Command, Calendar, and Form components
4. **Migrate** high-priority components (Tooltip, Dropdown Menu, Avatar) to Polaris

### Future Migrations
1. Alert Dialog → Polaris Modal with confirmation pattern
2. Popover → Polaris Popover
3. Scroll Area → Native CSS or Polaris Scrollable
4. Sidebar → Polaris layout components
5. Accordion → Polaris Collapsible

## Dependency Impact

### Radix UI Dependencies to Keep
- `@radix-ui/react-dialog` - For Command component
- `@radix-ui/react-label` - For Form component (or migrate to Polaris)

### Dependencies to Remove (After Component Removal)
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog` (after migration)
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar` (after migration)
- `@radix-ui/react-checkbox` (replaced)
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-dropdown-menu` (after migration)
- `@radix-ui/react-hover-card`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover` (after migration)
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group` (replaced)
- `@radix-ui/react-scroll-area` (after migration)
- `@radix-ui/react-select` (replaced)
- `@radix-ui/react-separator` (replaced)
- `@radix-ui/react-slider`
- `@radix-ui/react-switch` (replaced)
- `@radix-ui/react-tabs` (replaced)
- `@radix-ui/react-toast` (replaced)
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip` (after migration)
- `@radix-ui/react-slot` (utility, check usage)

### Other Dependencies to Keep
- `react-day-picker` - For Calendar component
- `cmdk` - For Command component
- `embla-carousel-react` - For carousel if still needed
- `input-otp` - If OTP input is needed
- `sonner` - Check if still used for toasts
- `vaul` - Check if used for drawers
- `react-resizable-panels` - For resizable layouts

## Testing Requirements

Before removing components:
1. ✅ Verify zero imports via codebase search
2. ✅ Check that index.ts exports Polaris replacements
3. ⬜ Run application and test all portals
4. ⬜ Verify no runtime errors
5. ⬜ Check that styling is consistent

## Version
- **Created**: January 2026
- **Last Updated**: January 2026
- **Migration Status**: Partial cleanup pending
