'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from '@/lib/animations/gsap-config'
import { WheelEntry, GiveawayWinner } from '@/lib/giveaway/types'
import { selectWeightedRandomEntry, calculateEntryWeights } from '@/lib/giveaway/comment-parser'

interface RouletteWheelProps {
  entries: WheelEntry[]
  onWinnerSelected: (winner: GiveawayWinner) => void
  isSpinning: boolean
  setIsSpinning: (spinning: boolean) => void
}

// Monochromatic grayscale palette
const SEGMENT_COLORS = [
  '#1a1a1a', // Near black
  '#2d2d2d', // Dark gray
  '#404040', // Medium dark
  '#525252', // Medium gray
  '#666666', // Light medium
  '#808080', // Mid gray
]

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  entries,
  onWinnerSelected,
  isSpinning,
  setIsSpinning,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [selectedEntry, setSelectedEntry] = useState<WheelEntry | null>(null)

  // Initial entrance animation
  useEffect(() => {
    if (entries.length > 0 && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          wheelRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' }
        )

        gsap.fromTo(
          pointerRef.current,
          { y: -10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, delay: 0.2, ease: 'power2.out' }
        )

        gsap.fromTo(
          buttonRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, delay: 0.3, ease: 'power2.out' }
        )
      }, containerRef)

      return () => ctx.revert()
    }
  }, [entries.length])

  const handleSpin = useCallback(() => {
    if (isSpinning || entries.length === 0) return

    setIsSpinning(true)

    const weights = calculateEntryWeights(entries)
    const winner = selectWeightedRandomEntry(entries, weights)
    setSelectedEntry(winner)

    const anglePerSegment = 360 / entries.length
    const winnerIndex = entries.findIndex(e => e.id === winner.id)
    const segmentCenterOffset = anglePerSegment / 2
    const targetAngle = 360 - (winnerIndex * anglePerSegment + segmentCenterOffset)
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const totalRotation = 360 * fullSpins + targetAngle

    const tl = gsap.timeline()

    // Subtle anticipation
    tl.to(wheelRef.current, {
      rotation: -10,
      duration: 0.25,
      ease: 'power2.in',
    })

    // Main spin
    tl.to(wheelRef.current, {
      rotation: totalRotation,
      duration: 4.5,
      ease: 'power4.out',
    })

    // Pointer subtle bounce
    tl.to(
      pointerRef.current,
      {
        y: 2,
        duration: 0.08,
        repeat: 35,
        yoyo: true,
        ease: 'none',
      },
      0.25
    )

    tl.call(() => {
      setIsSpinning(false)

      // Subtle winner highlight
      gsap.to(wheelRef.current, {
        scale: 1.01,
        duration: 0.15,
        yoyo: true,
        repeat: 2,
        ease: 'power2.inOut',
      })

      setTimeout(() => {
        onWinnerSelected({
          tagger: winner.tagger,
          tagged: winner.tagged,
          wheelEntryId: winner.id,
          selectedAt: new Date(),
        })
      }, 600)
    })
  }, [entries, isSpinning, onWinnerSelected, setIsSpinning])

  useEffect(() => {
    if (entries.length > 0 && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">⚪</div>
          <p className="text-gray-500 text-base">No entries to display</p>
          <p className="text-gray-600 text-sm mt-1">Parse comments first</p>
        </div>
      </div>
    )
  }

  const anglePerSegment = 360 / entries.length
  const conicGradient = entries
    .map((_, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]
      const startAngle = (i * anglePerSegment).toFixed(2)
      const endAngle = ((i + 1) * anglePerSegment).toFixed(2)
      return `${color} ${startAngle}deg ${endAngle}deg`
    })
    .join(', ')

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center gap-8 py-12"
    >
      {/* Wheel Container */}
      <div className="relative w-80 h-80 md:w-96 md:h-96">
        {/* Main Wheel */}
        <div
          ref={wheelRef}
          className="absolute inset-0 rounded-full overflow-hidden border border-gray-800"
          style={{
            background: `conic-gradient(${conicGradient})`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Segment dividers */}
          {entries.map((_, index) => (
            <div
              key={`divider-${index}`}
              className="absolute top-1/2 left-1/2 w-px h-1/2 bg-white/10 origin-bottom"
              style={{
                transform: `rotate(${index * anglePerSegment}deg) translateX(-50%)`,
              }}
            />
          ))}

          {/* Entry labels */}
          {entries.map((entry, index) => {
            const rotationDeg = index * anglePerSegment + anglePerSegment / 2

            return (
              <div
                key={entry.id}
                className="absolute inset-0 flex items-start justify-center pointer-events-none"
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                }}
              >
                <div
                  className="mt-8 text-white font-medium text-center"
                  style={{
                    fontSize: entries.length > 12 ? '10px' : entries.length > 8 ? '11px' : '12px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    transform: rotationDeg > 90 && rotationDeg < 270 ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <span className="opacity-80">@{entry.tagger}</span>
                  <br />
                  <span className="opacity-40">→</span>
                  <br />
                  <span className="opacity-80">@{entry.tagged}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white z-10 flex items-center justify-center shadow-lg">
          <div className="w-3 h-3 rounded-full bg-black" />
        </div>

        {/* Pointer */}
        <div
          ref={pointerRef}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-white shadow-lg" />
        </div>
      </div>

      {/* Spin Button */}
      <button
        ref={buttonRef}
        onClick={handleSpin}
        disabled={isSpinning || entries.length === 0}
        className="px-8 py-3 bg-white text-black font-medium rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </button>

      {/* Entry count */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </p>
        {selectedEntry && !isSpinning && (
          <p className="text-xs text-gray-600 mt-1">
            Last: {selectedEntry.displayName}
          </p>
        )}
      </div>
    </div>
  )
}

export default RouletteWheel
