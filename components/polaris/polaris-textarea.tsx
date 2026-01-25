'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PolarisTextareaProps } from './types'

const textareaBase =
  'flex min-h-[80px] w-full resize-y rounded-[var(--p-border-radius-200)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] px-3 py-2 text-sm text-[var(--p-color-text)] placeholder:text-[var(--p-color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

export const PolarisTextarea = React.forwardRef<HTMLTextAreaElement, PolarisTextareaProps>(
  function PolarisTextarea(
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
      rows = 3,
      maxLength,
      showCharacterCount,
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
        <textarea
          ref={ref}
          id={id}
          value={value}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={isReadOnly}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          onInput={onInput as React.FormEventHandler<HTMLTextAreaElement>}
          onFocus={onFocus as React.FocusEventHandler<HTMLTextAreaElement>}
          onBlur={onBlur as React.FocusEventHandler<HTMLTextAreaElement>}
          className={cn(
            textareaBase,
            hasError && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
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
