'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * SettingsPageHeader — shared top bar for focused vendor settings pages.
 *
 * Every vendor-profile sub-page (payment, tax, notifications, address,
 * edit) uses the same pattern: a back chevron linking to the settings
 * hub, a title, and an optional subtitle. This keeps the "calm UX"
 * promised in the AppShell redesign consistent across pages.
 */
export interface SettingsPageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  right?: React.ReactNode
}

export function SettingsPageHeader({
  title,
  subtitle,
  backHref = '/vendor/profile/settings',
  backLabel = 'Settings',
  right,
}: SettingsPageHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-3 space-y-2">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-gray-500 font-body hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-heading font-semibold text-gray-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 font-body mt-0.5">{subtitle}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  )
}
