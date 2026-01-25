'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisDataTableProps } from './types'

/**
 * React wrapper for Polaris p-data-table web component
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
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (columnContentTypes.length > 0) {
      element.setAttribute('column-content-types', JSON.stringify(columnContentTypes))
    }
    if (headings.length > 0) {
      element.setAttribute('headings', JSON.stringify(headings))
    }
    if (rows.length > 0) {
      // Convert rows to the format expected by Polaris
      const formattedRows = rows.map((row) => {
        if (Array.isArray(row)) {
          return row
        } else {
          // Convert object to array based on headings
          return headings.map((heading) => row[heading] ?? '')
        }
      })
      element.setAttribute('rows', JSON.stringify(formattedRows))
    }
    if (sortable.length > 0) {
      element.setAttribute('sortable', JSON.stringify(sortable))
    }
    if (defaultSortDirection) {
      element.setAttribute('default-sort-direction', defaultSortDirection)
    }
    if (initialSortColumnIndex !== undefined) {
      element.setAttribute('initial-sort-column-index', String(initialSortColumnIndex))
    }
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle sort events
    if (onSort) {
      const handleSort = (event: Event) => {
        const customEvent = event as CustomEvent<{ columnIndex: number; direction: 'ascending' | 'descending' }>
        onSort(customEvent.detail.columnIndex, customEvent.detail.direction)
      }
      element.addEventListener('sort', handleSort)
      return () => {
        element.removeEventListener('sort', handleSort)
      }
    }
  }, [
    columnContentTypes,
    headings,
    rows,
    sortable,
    defaultSortDirection,
    initialSortColumnIndex,
    onSort,
    className,
    style,
  ])

  return React.createElement('p-data-table', { ref, ...props }, children)
}

// Table sub-components for backward compatibility (using standard HTML table elements)
export function PolarisTable({ children, className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={className} {...props}>
      {children}
    </table>
  )
}

export function PolarisTableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

export function PolarisTableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export function PolarisTableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  )
}

export function PolarisTableHead({ children, className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  )
}

export function PolarisTableCell({ children, className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  )
}
