/**
 * Framework-Agnostic Component Interfaces
 * 
 * These interfaces define the public API for all UI components.
 * Implementation details (Polaris, MUI, etc.) are hidden behind these contracts.
 * 
 * @see docs/UI_MIGRATION_STRATEGY.md for migration guide
 */

import { ReactNode, CSSProperties } from 'react'

// ============================================================================
// BUTTON
// ============================================================================

export interface ButtonProps {
  /**
   * Visual style variant
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'plain' | 'outline'
  
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Loading state (shows spinner)
   */
  loading?: boolean
  
  /**
   * Full width button
   */
  fullWidth?: boolean
  
  /**
   * Click handler
   */
  onClick?: () => void | Promise<void>
  
  /**
   * Button content
   */
  children: ReactNode
  
  /**
   * Button type for forms
   */
  type?: 'button' | 'submit' | 'reset'
  
  /**
   * Custom CSS class
   */
  className?: string
  
  /**
   * Optional icon to display before text
   */
  icon?: ReactNode
  
  /**
   * Optional icon to display after text
   */
  iconAfter?: ReactNode
}

// ============================================================================
// CARD
// ============================================================================

export interface CardProps {
  /**
   * Card content
   */
  children: ReactNode
  
  /**
   * Internal padding
   */
  padding?: 'none' | 'small' | 'medium' | 'large'
  
  /**
   * Show shadow
   */
  shadow?: boolean
  
  /**
   * Hover effect
   */
  hoverable?: boolean
  
  /**
   * Background color
   */
  background?: 'default' | 'subdued' | 'transparent'
  
  /**
   * Custom CSS class
   */
  className?: string
  
  /**
   * Click handler (for clickable cards)
   */
  onClick?: () => void
}

export interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export interface CardTitleProps {
  children: ReactNode
  className?: string
}

export interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export interface CardContentProps {
  children: ReactNode
  className?: string
}

export interface CardFooterProps {
  children: ReactNode
  className?: string
}

// ============================================================================
// INPUT / TEXT FIELD
// ============================================================================

export interface InputProps {
  /**
   * Input label
   */
  label?: string
  
  /**
   * Current value
   */
  value: string
  
  /**
   * Change handler
   */
  onChange: (value: string) => void
  
  /**
   * Error message
   */
  error?: string
  
  /**
   * Help text shown below input
   */
  helpText?: string
  
  /**
   * Placeholder text
   */
  placeholder?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Required field indicator
   */
  required?: boolean
  
  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  
  /**
   * Autocomplete attribute
   */
  autoComplete?: string
  
  /**
   * Maximum length
   */
  maxLength?: number
  
  /**
   * Prefix content (icon or text)
   */
  prefix?: ReactNode
  
  /**
   * Suffix content (icon or text)
   */
  suffix?: ReactNode
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// SELECT / DROPDOWN
// ============================================================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  /**
   * Select label
   */
  label?: string
  
  /**
   * Current value
   */
  value: string
  
  /**
   * Change handler
   */
  onChange: (value: string) => void
  
  /**
   * Available options
   */
  options: SelectOption[]
  
  /**
   * Placeholder text
   */
  placeholder?: string
  
  /**
   * Error message
   */
  error?: string
  
  /**
   * Help text
   */
  helpText?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Required field
   */
  required?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// DIALOG / MODAL
// ============================================================================

export interface DialogProps {
  /**
   * Open state
   */
  open: boolean
  
  /**
   * Close handler
   */
  onClose: () => void
  
  /**
   * Dialog title
   */
  title?: string
  
  /**
   * Dialog size
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  
  /**
   * Dialog content
   */
  children: ReactNode
  
  /**
   * Show close button
   */
  showCloseButton?: boolean
  
  /**
   * Close on overlay click
   */
  closeOnOverlayClick?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

export interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export interface DialogTitleProps {
  children: ReactNode
  className?: string
}

export interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

export interface DialogContentProps {
  children: ReactNode
  className?: string
}

export interface DialogFooterProps {
  children: ReactNode
  className?: string
}

// ============================================================================
// BADGE
// ============================================================================

export interface BadgeProps {
  /**
   * Badge content
   */
  children: ReactNode
  
  /**
   * Visual tone/color
   */
  tone?: 'info' | 'success' | 'warning' | 'critical' | 'attention' | 'neutral'
  
  /**
   * Badge size
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Custom CSS class
   */
  className?: string
  
  /**
   * Optional icon
   */
  icon?: ReactNode
}

// ============================================================================
// TABLE
// ============================================================================

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  width?: string | number
}

export interface TableProps<T = any> {
  /**
   * Table columns
   */
  columns: Column<T>[]
  
  /**
   * Table data
   */
  data: T[]
  
  /**
   * Loading state
   */
  loading?: boolean
  
  /**
   * Empty state message
   */
  emptyMessage?: string
  
  /**
   * Row key extractor
   */
  rowKey: (item: T) => string | number
  
  /**
   * Row click handler
   */
  onRowClick?: (item: T) => void
  
  /**
   * Sortable behavior
   */
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  
  /**
   * Current sort state
   */
  sortState?: {
    key: string
    direction: 'asc' | 'desc'
  }
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// TABS
// ============================================================================

export interface Tab {
  id: string
  label: string
  disabled?: boolean
  icon?: ReactNode
}

export interface TabsProps {
  /**
   * Available tabs
   */
  tabs: Tab[]
  
  /**
   * Active tab ID
   */
  activeTab: string
  
  /**
   * Tab change handler
   */
  onChange: (tabId: string) => void
  
  /**
   * Tab content
   */
  children: ReactNode
  
  /**
   * Tabs variant
   */
  variant?: 'default' | 'fitted'
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// ALERT / BANNER
// ============================================================================

export interface AlertProps {
  /**
   * Alert tone/severity
   */
  tone?: 'info' | 'success' | 'warning' | 'critical'
  
  /**
   * Alert title
   */
  title?: string
  
  /**
   * Alert message
   */
  children: ReactNode
  
  /**
   * Dismissible alert
   */
  dismissible?: boolean
  
  /**
   * Dismiss handler
   */
  onDismiss?: () => void
  
  /**
   * Optional action button
   */
  action?: {
    label: string
    onClick: () => void
  }
  
  /**
   * Custom CSS class
   */
  className?: string
  
  /**
   * Optional icon
   */
  icon?: ReactNode
}

// ============================================================================
// CHECKBOX
// ============================================================================

export interface CheckboxProps {
  /**
   * Checked state
   */
  checked: boolean
  
  /**
   * Change handler
   */
  onChange: (checked: boolean) => void
  
  /**
   * Checkbox label
   */
  label?: string
  
  /**
   * Help text
   */
  helpText?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Error message
   */
  error?: string
  
  /**
   * Indeterminate state (for "select all" checkboxes)
   */
  indeterminate?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// RADIO GROUP
// ============================================================================

export interface RadioOption {
  value: string
  label: string
  helpText?: string
  disabled?: boolean
}

export interface RadioGroupProps {
  /**
   * Radio group label
   */
  label?: string
  
  /**
   * Current value
   */
  value: string
  
  /**
   * Change handler
   */
  onChange: (value: string) => void
  
  /**
   * Available options
   */
  options: RadioOption[]
  
  /**
   * Error message
   */
  error?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// SWITCH / TOGGLE
// ============================================================================

export interface SwitchProps {
  /**
   * Checked state
   */
  checked: boolean
  
  /**
   * Change handler
   */
  onChange: (checked: boolean) => void
  
  /**
   * Switch label
   */
  label?: string
  
  /**
   * Help text
   */
  helpText?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// TEXTAREA
// ============================================================================

export interface TextareaProps {
  /**
   * Textarea label
   */
  label?: string
  
  /**
   * Current value
   */
  value: string
  
  /**
   * Change handler
   */
  onChange: (value: string) => void
  
  /**
   * Placeholder text
   */
  placeholder?: string
  
  /**
   * Error message
   */
  error?: string
  
  /**
   * Help text
   */
  helpText?: string
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Required field
   */
  required?: boolean
  
  /**
   * Number of visible rows
   */
  rows?: number
  
  /**
   * Maximum length
   */
  maxLength?: number
  
  /**
   * Show character count
   */
  showCharacterCount?: boolean
  
  /**
   * Auto-resize to fit content
   */
  autoResize?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// TOAST / NOTIFICATION
// ============================================================================

export interface ToastOptions {
  /**
   * Toast message
   */
  message: string
  
  /**
   * Toast type
   */
  type?: 'info' | 'success' | 'warning' | 'error'
  
  /**
   * Duration in milliseconds (0 = no auto-dismiss)
   */
  duration?: number
  
  /**
   * Optional action
   */
  action?: {
    label: string
    onClick: () => void
  }
  
  /**
   * Toast ID (for programmatic dismissal)
   */
  id?: string
}

export interface ToastAPI {
  show: (options: ToastOptions) => string
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

// ============================================================================
// SKELETON / LOADING
// ============================================================================

export interface SkeletonProps {
  /**
   * Skeleton variant
   */
  variant?: 'text' | 'circular' | 'rectangular'
  
  /**
   * Width (CSS value)
   */
  width?: string | number
  
  /**
   * Height (CSS value)
   */
  height?: string | number
  
  /**
   * Animation style
   */
  animation?: 'pulse' | 'wave' | false
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// TOOLTIP
// ============================================================================

export interface TooltipProps {
  /**
   * Tooltip content
   */
  content: ReactNode
  
  /**
   * Element to attach tooltip to
   */
  children: ReactNode
  
  /**
   * Tooltip placement
   */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  
  /**
   * Show delay in milliseconds
   */
  delay?: number
  
  /**
   * Disabled state
   */
  disabled?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// SEPARATOR / DIVIDER
// ============================================================================

export interface SeparatorProps {
  /**
   * Orientation
   */
  orientation?: 'horizontal' | 'vertical'
  
  /**
   * Show decorative element
   */
  decorative?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// LABEL
// ============================================================================

export interface LabelProps {
  /**
   * Label content
   */
  children: ReactNode
  
  /**
   * Associated input ID
   */
  htmlFor?: string
  
  /**
   * Required indicator
   */
  required?: boolean
  
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ReactNode,
  CSSProperties,
}
