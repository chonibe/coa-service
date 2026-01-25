/**
 * Backward-compatible exports for UI components
 * This file exports Polaris wrappers with the same names as Shadcn components
 * to minimize changes during migration
 */

// Core components
export {
  PolarisButton as Button,
  buttonVariants,
  type PolarisButtonProps as ButtonProps,
  type ButtonVariantsProps,
} from '@/components/polaris/polaris-button'

export {
  PolarisCard as Card,
  PolarisCardHeader as CardHeader,
  PolarisCardTitle as CardTitle,
  PolarisCardDescription as CardDescription,
  PolarisCardContent as CardContent,
  PolarisCardFooter as CardFooter,
  type PolarisCardProps as CardProps,
} from '@/components/polaris/polaris-card'

export {
  PolarisTextField as Input,
  PolarisInput,
  type PolarisTextFieldProps as InputProps,
} from '@/components/polaris/polaris-text-field'

export {
  PolarisDialog as Dialog,
  PolarisDialogHeader as DialogHeader,
  PolarisDialogTitle as DialogTitle,
  PolarisDialogDescription as DialogDescription,
  PolarisDialogContent as DialogContent,
  PolarisDialogFooter as DialogFooter,
  PolarisDialogTrigger as DialogTrigger,
  type PolarisDialogProps as DialogProps,
} from '@/components/polaris/polaris-dialog'

export {
  PolarisBadge as Badge,
  type PolarisBadgeProps as BadgeProps,
} from '@/components/polaris/polaris-badge'

export {
  PolarisSelect as Select,
  PolarisSelectTrigger as SelectTrigger,
  PolarisSelectContent as SelectContent,
  PolarisSelectItem as SelectItem,
  PolarisSelectValue as SelectValue,
  type PolarisSelectProps as SelectProps,
} from '@/components/polaris/polaris-select'

export {
  PolarisDataTable as Table,
  PolarisTable,
  PolarisTableHeader as TableHeader,
  PolarisTableBody as TableBody,
  PolarisTableRow as TableRow,
  PolarisTableHead as TableHead,
  PolarisTableCell as TableCell,
  type PolarisDataTableProps as TableProps,
} from '@/components/polaris/polaris-data-table'

export {
  PolarisTabs as Tabs,
  PolarisTabsList as TabsList,
  PolarisTabsTrigger as TabsTrigger,
  PolarisTabsContent as TabsContent,
  type PolarisTabsProps as TabsProps,
} from '@/components/polaris/polaris-tabs'

export {
  PolarisBanner as Alert,
  PolarisAlert,
  PolarisAlertTitle as AlertTitle,
  PolarisAlertDescription as AlertDescription,
  type PolarisBannerProps as AlertProps,
} from '@/components/polaris/polaris-banner'

// Form components
export {
  PolarisTextField as TextField,
  type PolarisTextFieldProps as TextFieldProps,
} from '@/components/polaris/polaris-text-field'

export {
  PolarisCheckbox as Checkbox,
  type PolarisCheckboxProps as CheckboxProps,
} from '@/components/polaris/polaris-checkbox'

export {
  PolarisRadio as Radio,
  PolarisRadioGroup as RadioGroup,
  PolarisRadioGroupItem as RadioGroupItem,
  type PolarisRadioProps as RadioProps,
} from '@/components/polaris/polaris-radio'

export {
  PolarisSwitch as Switch,
  type PolarisSwitchProps as SwitchProps,
} from '@/components/polaris/polaris-switch'

export {
  PolarisTextarea as Textarea,
  type PolarisTextareaProps as TextareaProps,
} from '@/components/polaris/polaris-textarea'

// Layout components
export {
  PolarisStack as Stack,
  type PolarisStackProps as StackProps,
} from '@/components/polaris/polaris-stack'

export {
  PolarisGrid as Grid,
  type PolarisGridProps as GridProps,
} from '@/components/polaris/polaris-grid'

export {
  PolarisPage as Page,
  type PolarisPageProps as PageProps,
} from '@/components/polaris/polaris-page'

export {
  PolarisLayout as Layout,
  PolarisLayoutSection as LayoutSection,
  type PolarisLayoutProps as LayoutProps,
  type PolarisLayoutSectionProps as LayoutSectionProps,
} from '@/components/polaris/polaris-layout'

export {
  PolarisNavigation as Navigation,
  type PolarisNavigationProps as NavigationProps,
} from '@/components/polaris/polaris-navigation'

// Advanced components
export {
  PolarisAutocomplete as Autocomplete,
  type PolarisAutocompleteProps as AutocompleteProps,
} from '@/components/polaris/polaris-autocomplete'

export {
  PolarisDatePicker as DatePicker,
  type PolarisDatePickerProps as DatePickerProps,
} from '@/components/polaris/polaris-date-picker'

export {
  PolarisModal as Modal,
  type PolarisModalProps as ModalProps,
} from '@/components/polaris/polaris-modal'

export {
  PolarisSheet as Sheet,
  type PolarisSheetProps as SheetProps,
} from '@/components/polaris/polaris-sheet'

// Additional utility components
export {
  PolarisSkeleton as Skeleton,
  type PolarisSkeletonProps as SkeletonProps,
} from '@/components/polaris/polaris-skeleton'

export {
  PolarisSeparator as Separator,
  type PolarisSeparatorProps as SeparatorProps,
} from '@/components/polaris/polaris-separator'

export {
  PolarisLabel as Label,
  type PolarisLabelProps as LabelProps,
} from '@/components/polaris/polaris-label'

export {
  Progress,
  type ProgressProps,
} from '@/components/polaris/polaris-progress'

export {
  Toaster,
  toast,
  type ToasterProps,
} from '@/components/polaris/polaris-toaster'
