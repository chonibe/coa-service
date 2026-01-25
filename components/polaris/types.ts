/**
 * TypeScript definitions for Polaris Web Components
 * These types define the interfaces for Polaris web component attributes
 */

// Base web component props that can be passed to any Polaris component
export interface PolarisWebComponentProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
  style?: React.CSSProperties
}

// Button component types
export interface PolarisButtonProps extends PolarisWebComponentProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'plain' | 'destructive'
  size?: 'slim' | 'medium' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  submit?: boolean
  url?: string
  external?: boolean
  download?: boolean | string
  onClick?: (event: MouseEvent) => void
  children?: React.ReactNode
}

// Card component types
export interface PolarisCardProps extends PolarisWebComponentProps {
  background?: string
  padding?: 'base' | 'tight' | 'loose'
  roundedAbove?: 'sm' | 'md' | 'lg' | 'xl'
  children?: React.ReactNode
}

// TextField/Input component types
export interface PolarisTextFieldProps extends PolarisWebComponentProps {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
  value?: string
  type?: 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url'
  multiline?: boolean | number
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
  clearButton?: boolean
  onChange?: (event: Event) => void
  onInput?: (event: Event) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
}

// Select component types
export interface PolarisSelectProps extends PolarisWebComponentProps {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  disabled?: boolean
  placeholder?: string
  value?: string
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  onChange?: (event: Event) => void
}

// Dialog/Modal component types
export interface PolarisDialogProps extends PolarisWebComponentProps {
  open?: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullWidth'
  onClose?: () => void
  children?: React.ReactNode
}

// Badge component types
export interface PolarisBadgeProps extends PolarisWebComponentProps {
  tone?: 'info' | 'success' | 'attention' | 'warning' | 'critical'
  size?: 'small' | 'medium' | 'large'
  children?: React.ReactNode
}

// Table/DataTable component types
export interface PolarisDataTableProps extends PolarisWebComponentProps {
  columnContentTypes?: Array<'text' | 'numeric'>
  headings?: string[]
  rows?: Array<string[] | { [key: string]: string | number }>
  sortable?: boolean[]
  defaultSortDirection?: 'ascending' | 'descending'
  initialSortColumnIndex?: number
  onSort?: (columnIndex: number, direction: 'ascending' | 'descending') => void
  children?: React.ReactNode
}

// Tabs component types
export interface PolarisTabsProps extends PolarisWebComponentProps {
  tabs?: Array<{ id: string; content: string; panelID?: string; url?: string }>
  selected?: number
  onSelect?: (selectedTabIndex: number) => void
  children?: React.ReactNode
}

// Banner/Alert component types
export interface PolarisBannerProps extends PolarisWebComponentProps {
  tone?: 'info' | 'success' | 'warning' | 'critical'
  title?: string
  status?: 'info' | 'success' | 'warning' | 'critical'
  onDismiss?: () => void
  children?: React.ReactNode
}

// Stack layout component types
export interface PolarisStackProps extends PolarisWebComponentProps {
  spacing?: 'extraTight' | 'tight' | 'base' | 'loose' | 'extraLoose'
  distribution?: 'equalSpacing' | 'leading' | 'trailing' | 'center' | 'fill' | 'fillEvenly'
  alignment?: 'leading' | 'trailing' | 'center' | 'fill' | 'baseline'
  vertical?: boolean
  wrap?: boolean
  children?: React.ReactNode
}

// Grid component types
export interface PolarisGridProps extends PolarisWebComponentProps {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: 'base' | 'tight' | 'loose'
  children?: React.ReactNode
}

// Checkbox component types
export interface PolarisCheckboxProps extends PolarisWebComponentProps {
  label?: string
  checked?: boolean
  disabled?: boolean
  error?: string | boolean
  helpText?: string
  id?: string
  name?: string
  value?: string
  onChange?: (checked: boolean) => void
  children?: React.ReactNode
}

// Radio component types
export interface PolarisRadioProps extends PolarisWebComponentProps {
  label?: string
  checked?: boolean
  disabled?: boolean
  id?: string
  name?: string
  value?: string
  helpText?: string
  onChange?: (checked: boolean) => void
  children?: React.ReactNode
}

// Switch component types
export interface PolarisSwitchProps extends PolarisWebComponentProps {
  label?: string
  checked?: boolean
  disabled?: boolean
  id?: string
  name?: string
  helpText?: string
  onChange?: (checked: boolean) => void
  children?: React.ReactNode
}

// Textarea component types
export interface PolarisTextareaProps extends PolarisWebComponentProps {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
  value?: string
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
  onChange?: (event: Event) => void
  onInput?: (event: Event) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
}
