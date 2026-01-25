'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const spacingMap = {
  extraTight: 'gap-1',
  tight: 'gap-2',
  base: 'gap-4',
  loose: 'gap-6',
  extraLoose: 'gap-8',
} as const

const distributionMap = {
  equalSpacing: 'justify-between',
  leading: 'justify-start',
  trailing: 'justify-end',
  center: 'justify-center',
  fill: 'flex-1 [&>*]:flex-1',
  fillEvenly: 'justify-evenly',
} as const

const alignmentMap = {
  leading: 'items-start',
  trailing: 'items-end',
  center: 'items-center',
  fill: 'items-stretch',
  baseline: 'items-baseline',
} as const

export interface PolarisStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'extraTight' | 'tight' | 'base' | 'loose' | 'extraLoose'
  distribution?: 'equalSpacing' | 'leading' | 'trailing' | 'center' | 'fill' | 'fillEvenly'
  alignment?: 'leading' | 'trailing' | 'center' | 'fill' | 'baseline'
  vertical?: boolean
  wrap?: boolean
  children?: React.ReactNode
}

export function PolarisStack({
  spacing = 'base',
  distribution,
  alignment,
  vertical = false,
  wrap = false,
  children,
  className,
  ...props
}: PolarisStackProps) {
  return (
    <div
      className={cn(
        'flex',
        vertical ? 'flex-col' : 'flex-row',
        spacingMap[spacing],
        distribution && distributionMap[distribution],
        alignment && alignmentMap[alignment],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
