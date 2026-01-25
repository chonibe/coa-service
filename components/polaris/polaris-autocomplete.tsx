'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const inputBase =
  'flex h-10 w-full rounded-[var(--p-border-radius-200)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] px-3 py-2 text-sm text-[var(--p-color-text)] placeholder:text-[var(--p-color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

export interface PolarisAutocompleteProps {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  disabled?: boolean
  placeholder?: string
  value?: string
  options?: Array<{ value: string; label: string }>
  onChange?: (value: string) => void
  onSelect?: (value: string) => void
  className?: string
  id?: string
}

export function PolarisAutocomplete({
  label,
  labelHidden,
  helpText,
  error,
  requiredIndicator,
  disabled,
  placeholder,
  value = '',
  options = [],
  onChange,
  onSelect,
  className,
  id: idProp,
}: PolarisAutocompleteProps) {
  const id = idProp ?? React.useId()
  const errorMessage = typeof error === 'string' ? error : undefined
  const hasError = Boolean(error)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const match = options.find((o) => o.value === value)
    setInputValue(match ? match.label : value ?? '')
  }, [value, options])

  const filtered = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    )
  }, [options, inputValue])

  React.useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    onChange?.(v)
    setOpen(true)
  }

  const handleSelect = (opt: { value: string; label: string }) => {
    setInputValue(opt.label)
    onChange?.(opt.value)
    onSelect?.(opt.value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && !labelHidden && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[var(--p-color-text)]"
        >
          {label}
          {requiredIndicator && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        className={cn(
          inputBase,
          hasError && 'border-red-500 focus:ring-red-500',
          className
        )}
      />
      {open && filtered.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[var(--p-border-radius-200)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] py-1 shadow-lg"
        >
          {filtered.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className="cursor-pointer px-3 py-2 text-sm text-[var(--p-color-text)] hover:bg-[var(--p-color-bg-surface-secondary)]"
              onClick={() => handleSelect(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {helpText && !hasError && (
        <p className="text-sm text-[var(--p-color-text-secondary)]">{helpText}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
