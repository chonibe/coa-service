'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const inputBase =
  'flex h-10 w-full rounded-[var(--p-border-radius-200)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] px-3 py-2 text-sm text-[var(--p-color-text)] placeholder:text-[var(--p-color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

export interface PolarisTextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onInput'> {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  readonly?: boolean
  readOnly?: boolean
  value?: string
  multiline?: boolean | number
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
  clearButton?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onInput?: (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export const PolarisTextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, PolarisTextFieldProps>(
  function PolarisTextField(
    {
      label,
      labelHidden,
      helpText,
      error,
      requiredIndicator,
      disabled,
      readonly,
      readOnly,
      placeholder,
      value,
      type = 'text',
      multiline,
      rows = 3,
      maxLength,
      showCharacterCount,
      clearButton,
      onChange,
      onInput,
      onFocus,
      onBlur,
      className,
      id: idProp,
      ...props
    },
    ref
  ) {
    const id = idProp ?? React.useId()
    const errorMessage = typeof error === 'string' ? error : undefined
    const hasError = Boolean(error)
    const isReadOnly = readonly ?? readOnly

    const inputEl = multiline ? (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        id={id}
        value={value}
        placeholder={placeholder}
        rows={typeof multiline === 'number' ? multiline : rows}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={isReadOnly}
        onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        onInput={onInput as React.FormEventHandler<HTMLTextAreaElement>}
        onFocus={onFocus as React.FocusEventHandler<HTMLTextAreaElement>}
        onBlur={onBlur as React.FocusEventHandler<HTMLTextAreaElement>}
        className={cn(
          inputBase,
          'min-h-[80px] resize-y py-2',
          hasError && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    ) : (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={isReadOnly}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        onInput={onInput as React.FormEventHandler<HTMLInputElement>}
        onFocus={onFocus as React.FocusEventHandler<HTMLInputElement>}
        onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
        className={cn(
          inputBase,
          hasError && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    )

    return (
      <div className="space-y-1.5">
        {label && !labelHidden && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--p-color-text)]"
          >
            {label}
            {requiredIndicator && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
          </label>
        )}
        {inputEl}
        {helpText && !hasError && (
          <p className="text-sm text-[var(--p-color-text-secondary)]">{helpText}</p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        )}
        {showCharacterCount && maxLength && typeof value === 'string' && (
          <p className="text-xs text-[var(--p-color-text-secondary)] text-right">
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    )
  }
)

export const PolarisInput = PolarisTextField
