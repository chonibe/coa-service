'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PolarisDataTableProps } from './types'

/**
 * Polaris-styled DataTable. Renders from headings/rows when provided, or children (compound usage).
 */
export function PolarisDataTable({
  columnContentTypes = [],
  headings = [],
  rows = [],
  sortable = [],
  defaultSortDirection,
  initialSortColumnIndex,
  onSort,
  children,
  className,
  style,
  ...props
}: PolarisDataTableProps) {
  const [sortCol, setSortCol] = React.useState<number | null>(
    initialSortColumnIndex ?? (sortable.length > 0 ? 0 : null)
  )
  const [sortDir, setSortDir] = React.useState<'ascending' | 'descending'>(
    defaultSortDirection ?? 'ascending'
  )

  const handleSort = React.useCallback(
    (colIndex: number) => {
      if (!sortable[colIndex]) return
      const next = sortCol === colIndex && sortDir === 'ascending' ? 'descending' : 'ascending'
      setSortCol(colIndex)
      setSortDir(next)
      onSort?.(colIndex, next)
    },
    [sortable, sortCol, sortDir, onSort]
  )

  const formattedRows = React.useMemo(() => {
    return rows.map((row) => {
      if (Array.isArray(row)) return row
      return headings.map((h) => String((row as Record<string, unknown>)[h] ?? ''))
    })
  }, [rows, headings])

  const sortedRows = React.useMemo(() => {
    if (sortCol == null || !formattedRows.length) return formattedRows
    const type = columnContentTypes[sortCol] ?? 'text'
    return [...formattedRows].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (type === 'numeric') {
        const an = Number(av)
        const bn = Number(bv)
        return sortDir === 'ascending' ? an - bn : bn - an
      }
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'ascending' ? cmp : -cmp
    })
  }, [formattedRows, sortCol, sortDir, columnContentTypes])

  if (children != null) {
    return (
      <div className={cn('relative w-full overflow-auto', className)} style={style} {...props}>
        <table className="w-full caption-bottom text-sm border-collapse">{children}</table>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-auto rounded-[var(--p-border-radius-200)] border border-[var(--p-color-border)]',
        className
      )}
      style={style}
      {...props}
    >
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b border-[var(--p-color-border)] bg-[var(--p-color-bg-surface-secondary)]">
            {headings.map((h, i) => (
              <th
                key={i}
                className={cn(
                  'h-10 px-4 text-left align-middle font-medium text-[var(--p-color-text-secondary)]',
                  sortable[i] && 'cursor-pointer hover:text-[var(--p-color-text)]'
                )}
                onClick={sortable[i] ? () => handleSort(i) : undefined}
              >
                {h}
                {sortable[i] && sortCol === i && (
                  <span className="ml-1" aria-hidden>
                    {sortDir === 'ascending' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--p-color-border)] transition-colors hover:bg-[var(--p-color-bg-surface-secondary)]/50"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'px-4 py-3 align-middle text-[var(--p-color-text)]',
                    (columnContentTypes[ci] ?? 'text') === 'numeric' && 'text-right tabular-nums'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const PolarisTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        'w-full caption-bottom text-sm border-collapse rounded-[var(--p-border-radius-200)]',
        className
      )}
      {...props}
    />
  </div>
))
PolarisTable.displayName = 'PolarisTable'

export const PolarisTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('[&_tr]:border-b [&_tr]:border-[var(--p-color-border)]', className)}
    {...props}
  />
))
PolarisTableHeader.displayName = 'PolarisTableHeader'

export const PolarisTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
PolarisTableBody.displayName = 'PolarisTableBody'

export const PolarisTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-[var(--p-color-border)] transition-colors hover:bg-[var(--p-color-bg-surface-secondary)]/50 data-[state=selected]:bg-[var(--p-color-bg-surface-secondary)]',
      className
    )}
    {...props}
  />
))
PolarisTableRow.displayName = 'PolarisTableRow'

export const PolarisTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 text-left align-middle font-medium text-[var(--p-color-text-secondary)] [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
PolarisTableHead.displayName = 'PolarisTableHead'

export const PolarisTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-3 align-middle text-[var(--p-color-text)] [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
PolarisTableCell.displayName = 'PolarisTableCell'
