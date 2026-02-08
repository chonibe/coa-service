'use client'

import React, { useEffect, useState, useRef } from 'react'
import Confetti from 'react-confetti'
import { gsap } from '@/lib/animations/gsap-config'
import { GiveawayWinner } from '@/lib/giveaway/types'

interface WinnerDisplayProps {
  winner: GiveawayWinner | null
  onClose: () => void
}

export const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winner, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const taggerCardRef = useRef<HTMLDivElement>(null)
  const taggedCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (winner && modalRef.current) {
      setShowConfetti(true)

      const ctx = gsap.context(() => {
        const tl = gsap.timeline()

        tl.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: 'power2.out' }
        )

        tl.fromTo(
          modalRef.current,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' },
          '-=0.1'
        )

        tl.fromTo(
          taggerCardRef.current,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
          '-=0.1'
        )

        tl.fromTo(
          taggedCardRef.current,
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
          '-=0.2'
        )
      }, modalRef)

      const confettiTimer = setTimeout(() => {
        setShowConfetti(false)
      }, 4000)

      return () => {
        ctx.revert()
        clearTimeout(confettiTimer)
      }
    }
  }, [winner])

  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: onClose,
    })

    tl.to(modalRef.current, {
      scale: 0.95,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
    })

    tl.to(overlayRef.current, { opacity: 0, duration: 0.15 }, '-=0.1')
  }

  if (!winner) {
    return null
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={200}
          gravity={0.12}
          colors={['#ffffff', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373']}
        />
      )}

      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          className="bg-black border border-white/10 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            {/* Title */}
            <h2 className="text-3xl font-semibold text-white mb-2">
              Winners
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Both take home the prize
            </p>

            {/* Winners */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {/* Tagger Card */}
              <div
                ref={taggerCardRef}
                className="flex-1 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center"
              >
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                  Tagger
                </p>
                <p className="text-xl font-semibold text-white">
                  @{winner.tagger}
                </p>
              </div>

              {/* Tagged Card */}
              <div
                ref={taggedCardRef}
                className="flex-1 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center"
              >
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                  Tagged
                </p>
                <p className="text-xl font-semibold text-white">
                  @{winner.tagged}
                </p>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleClose}
              className="w-full py-3 bg-white text-black rounded-full font-medium transition-all duration-200 hover:bg-gray-100 active:scale-95"
            >
              New Giveaway
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default WinnerDisplay
