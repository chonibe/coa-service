'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Soon'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function UpcomingDropCountdown({
  targetIso,
  notifyHref,
}: {
  targetIso: string
  notifyHref?: string
}) {
  const [label, setLabel] = useState('…')

  useEffect(() => {
    const target = new Date(targetIso).getTime()
    const tick = () => {
      const ms = target - Date.now()
      setLabel(formatRemaining(ms))
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [targetIso])

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span
        className="rounded-full px-2 py-0.5 text-[9px] font-medium uppercase"
        style={{
          background: 'rgba(255, 186, 148, 0.12)',
          color: 'var(--peach)',
          fontFamily: 'var(--font-landing-mono), monospace',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </span>
      <Link
        href={notifyHref || '/shop/reserve'}
        className="text-[9px] font-medium uppercase"
        style={{
          color: 'var(--peach)',
          fontFamily: 'var(--font-landing-mono), monospace',
          letterSpacing: '0.12em',
        }}
      >
        Notify me
      </Link>
    </div>
  )
}
