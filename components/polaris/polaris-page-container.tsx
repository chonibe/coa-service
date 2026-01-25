'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type PageContainerMaxWidth = '4xl' | '5xl' | '6xl' | '7xl' | 'full'
export type PageContainerPadding = 'none' | 'sm' | 'md' | 'lg'

const maxWidthMap: Record<PageContainerMaxWidth, string> = {
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

const paddingMap: Record<PageContainerPadding, string> = {
  none: 'p-0',
  sm: 'px-4 py-4 md:px-5 md:py-5',
  md: 'px-4 py-6 md:px-6 md:py-8 lg:px-8',
  lg: 'px-4 py-8 md:px-8 md:py-10 lg:px-10',
}

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: PageContainerMaxWidth
  padding?: PageContainerPadding
  children?: React.ReactNode
}

export function PageContainer({
  maxWidth = '7xl',
  padding = 'md',
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidth !== 'full' && maxWidthMap[maxWidth],
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
