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
    <div className="flex items-center justify-between gap-2">
      <span className="rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#791F1F]">
        {label}
      </span>
      <Link
        href={notifyHref || '/shop/reserve'}
        className="text-[11px] font-medium text-[#185FA5] dark:text-sky-400"
      >
        Notify me
      </Link>
    </div>
  )
}
