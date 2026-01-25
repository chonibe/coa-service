'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PolarisTabsProps } from './types'

type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within PolarisTabs')
  return ctx
}

export interface PolarisTabsPropsExtended extends PolarisTabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

/**
 * Polaris-styled Tabs. Use with TabsList, TabsTrigger, TabsContent.
 * Supports value/onValueChange (controlled) or defaultValue (uncontrolled).
 */
export function PolarisTabs({
  tabs = [],
  selected,
  onSelect,
  value: valueProp,
  defaultValue,
  onValueChange,
  children,
  className,
  style,
  ...props
}: PolarisTabsPropsExtended) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? (tabs[0]?.id ?? ''))
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : internalValue

  const handleChange = React.useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v)
      onValueChange?.(v)
      const idx = tabs.findIndex((t) => t.id === v)
      if (idx >= 0) onSelect?.(idx)
    },
    [isControlled, onValueChange, onSelect, tabs]
  )

  const ctx = React.useMemo(
    () => ({ value, onValueChange: handleChange }),
    [value, handleChange]
  )

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn('w-full', className)} style={style} data-value={value} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function PolarisTabsList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-[var(--p-border-radius-200)] bg-[var(--p-color-bg-surface-secondary)] p-1 text-[var(--p-color-text)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PolarisTabsTrigger({
  value,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: activeValue, onValueChange } = useTabs()
  const isActive = activeValue === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      data-value={value}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--p-border-radius-100)] px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-[var(--p-color-bg-surface)] text-[var(--p-color-text)] shadow-sm'
          : 'text-[var(--p-color-text-secondary)] hover:bg-[var(--p-color-bg-surface)]/50 hover:text-[var(--p-color-text)]',
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function PolarisTabsContent({
  value,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: activeValue } = useTabs()
  if (activeValue !== value) return null

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
