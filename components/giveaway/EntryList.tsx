'use client'

import React, { useEffect, useRef } from 'react'
import { gsap } from '@/lib/animations/gsap-config'
import { WheelEntry } from '@/lib/giveaway/types'

interface EntryListProps {
  entries: WheelEntry[]
  maxDisplay?: number
}

export const EntryList: React.FC<EntryListProps> = ({ entries, maxDisplay = 20 }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (entries.length > 0 && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        )

        const listItems = listRef.current?.querySelectorAll('.entry-item')
        if (listItems && listItems.length > 0) {
          gsap.fromTo(
            listItems,
            { x: -10, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out', delay: 0.1 }
          )
        }

        const statItems = statsRef.current?.querySelectorAll('.stat-item')
        if (statItems && statItems.length > 0) {
          gsap.fromTo(
            statItems,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
          )
        }
      }, containerRef)

      return () => ctx.revert()
    }
  }, [entries])

  if (entries.length === 0) {
    return null
  }

  const displayedEntries = entries.slice(0, maxDisplay)
  const hiddenCount = entries.length - displayedEntries.length
  const uniqueTaggers = new Set(entries.map(e => e.tagger)).size
  const uniqueTagged = new Set(entries.map(e => e.tagged)).size

  return (
    <div
      ref={containerRef}
      className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Entries</h3>
          <span className="text-white/60 text-sm">{entries.length}</span>
        </div>
      </div>

      {/* Entries list */}
      <div ref={listRef} className="max-h-64 overflow-y-auto">
        {displayedEntries.map((entry, index) => (
          <div
            key={entry.id}
            className="entry-item px-6 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors duration-150 flex items-center gap-3"
          >
            <span className="text-white/40 text-xs font-mono w-6">{index + 1}</span>
            <span className="text-white/80 text-sm">@{entry.tagger}</span>
            <span className="text-white/30 text-xs">→</span>
            <span className="text-white/80 text-sm">@{entry.tagged}</span>
          </div>
        ))}
      </div>

      {/* Hidden count */}
      {hiddenCount > 0 && (
        <div className="px-6 py-3 bg-white/5 text-center border-t border-white/10">
          <p className="text-xs text-white/60">
            +{hiddenCount} more
          </p>
        </div>
      )}

      {/* Statistics */}
      <div
        ref={statsRef}
        className="grid grid-cols-3 gap-px bg-white/5"
      >
        <div className="stat-item bg-black/40 p-4 text-center">
          <p className="text-lg font-semibold text-white">{entries.length}</p>
          <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Entries</p>
        </div>
        <div className="stat-item bg-black/40 p-4 text-center">
          <p className="text-lg font-semibold text-white">{uniqueTaggers}</p>
          <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Taggers</p>
        </div>
        <div className="stat-item bg-black/40 p-4 text-center">
          <p className="text-lg font-semibold text-white">{uniqueTagged}</p>
          <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Tagged</p>
        </div>
      </div>
    </div>
  )
}

export default EntryList
