'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Progress Ring
//
// Circular progress indicator for gamification elements:
// series completion, perk progress, level XP.
// Uses SVG with animated stroke-dashoffset.
// ============================================================================

export interface ProgressRingProps {
  /** Progress value 0-100 */
  progress: number
  /** Ring size in pixels */
  size?: number
  /** Stroke width */
  strokeWidth?: number
  /** Ring color (default: Impact primary blue) */
  color?: string
  /** Track color */
  trackColor?: string
  /** Show percentage label inside */
  showLabel?: boolean
  /** Custom label (overrides percentage) */
  label?: string
  /** Children rendered inside the ring */
  children?: React.ReactNode
  className?: string
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  color = '#047AFF',
  trackColor = '#e5e7eb',
  showLabel = false,
  label,
  children,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span className="text-xs font-bold font-body text-gray-700">
            {label || `${Math.round(progress)}%`}
          </span>
        ))}
      </div>
    </div>
  )
}
