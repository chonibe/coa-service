'use client'

import React, { useState, useRef, useEffect } from 'react'
import { gsap } from '@/lib/animations/gsap-config'
import { RouletteWheel } from '@/components/giveaway/RouletteWheel'
import { WinnerDisplay } from '@/components/giveaway/WinnerDisplay'
import { EntryList } from '@/components/giveaway/EntryList'
import { WheelEntry, GiveawayWinner, ParseResponse, SaveResponse } from '@/lib/giveaway/types'

export default function GiveawayPage() {
  const [step, setStep] = useState<'parse' | 'wheel' | 'result'>('parse')
  const [comments, setComments] = useState('')
  const [entries, setEntries] = useState<WheelEntry[]>([])
  const [giveawayName, setGiveawayName] = useState('')
  const [winner, setWinner] = useState<GiveawayWinner | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])

  const headerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const wheelContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (step === 'wheel' && wheelContainerRef.current) {
      gsap.fromTo(
        wheelContainerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }, [step])

  const handleParseComments = async () => {
    if (!comments.trim()) {
      setError('Please paste Instagram comments first.')
      return
    }

    if (!giveawayName.trim()) {
      setError('Please enter a giveaway name.')
      return
    }

    setIsLoading(true)
    setError('')
    setParseErrors([])

    try {
      const response = await fetch('/api/giveaway/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      })

      const data: ParseResponse = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to parse comments.')
        setIsLoading(false)
        return
      }

      if (!data.wheelEntries || data.wheelEntries.length === 0) {
        setError('No valid entries found. Make sure comments contain @username mentions.')
        setParseErrors(data.data?.errors || [])
        setIsLoading(false)
        return
      }

      setEntries(data.wheelEntries)
      setParseErrors(data.data?.errors || [])
      setStep('wheel')
    } catch (err) {
      setError('An error occurred while parsing comments.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWinnerSelected = async (selectedWinner: GiveawayWinner) => {
    setWinner(selectedWinner)
    setStep('result')

    try {
      await fetch('/api/giveaway/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giveawayName,
          entryData: {
            wheelEntries: entries,
            totalEntries: entries.length,
          },
          winnerData: {
            tagger: selectedWinner.tagger,
            tagged: selectedWinner.tagged,
            wheelEntryId: selectedWinner.wheelEntryId,
            selectedAt: selectedWinner.selectedAt.toISOString(),
          },
        }),
      })
    } catch (err) {
      console.error('Error saving to database:', err)
    }
  }

  const handleReset = () => {
    gsap.to(formRef.current || wheelContainerRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setStep('parse')
        setComments('')
        setGiveawayName('')
        setEntries([])
        setWinner(null)
        setError('')
        setParseErrors([])
      },
    })
  }

  const lineCount = comments.split('\n').filter(line => line.trim()).length

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header ref={headerRef} className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-semibold mb-2">Giveaway</h1>
          <p className="text-white/60 text-sm">Tag a friend to enter — both win the prize</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-6">
            {['Parse', 'Spin', 'Win'].map((label, i) => (
              <React.Fragment key={label}>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    (step === 'parse' && i === 0) ||
                    (step === 'wheel' && i === 1) ||
                    (step === 'result' && i === 2)
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {label}
                </div>
                {i < 2 && <div className="w-6 h-px bg-white/10" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Parse Step */}
        {step === 'parse' && (
          <div ref={formRef} className="max-w-xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 space-y-5">
                {/* Giveaway Name */}
                <div>
                  <label htmlFor="giveawayName" className="block text-sm font-medium text-white/80 mb-2">
                    Giveaway Name
                  </label>
                  <input
                    id="giveawayName"
                    type="text"
                    value={giveawayName}
                    onChange={e => setGiveawayName(e.target.value)}
                    placeholder="e.g., Limited Edition Vinyl"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 transition-colors text-white placeholder:text-white/30"
                  />
                </div>

                {/* Comments Textarea */}
                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-white/80 mb-2">
                    Instagram Comments
                  </label>
                  <div className="relative">
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder="Paste comments here..."
                      className="w-full h-48 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 transition-colors text-white placeholder:text-white/30 font-mono text-sm resize-none"
                    />
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur text-white/60 text-xs rounded-md">
                      {lineCount} lines
                    </div>
                  </div>
                </div>

                {/* Parse Button */}
                <button
                  onClick={handleParseComments}
                  disabled={isLoading || !comments.trim() || !giveawayName.trim()}
                  className="w-full py-3 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  {isLoading ? 'Parsing...' : 'Continue'}
                </button>
              </div>

              {/* Instructions */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-xs text-white/60 space-y-1">
                <p>• Each line = one Instagram comment</p>
                <p>• First @mention = the tagger</p>
                <p>• Other @mentions = tagged friends</p>
                <p>• Each tag = 1 wheel entry</p>
              </div>
            </div>
          </div>
        )}

        {/* Wheel Step */}
        {step === 'wheel' && (
          <div ref={wheelContainerRef} className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-white">{giveawayName}</h2>
                <p className="text-white/60 text-sm mt-1">{entries.length} entries</p>
              </div>
              <button
                onClick={handleReset}
                disabled={isSpinning}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 text-sm rounded-lg transition-colors disabled:opacity-40"
              >
                Back
              </button>
            </div>

            {parseErrors.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-xs font-medium mb-2">
                  {parseErrors.length} warning{parseErrors.length > 1 ? 's' : ''}
                </p>
                <ul className="text-xs text-yellow-400/80 space-y-1 max-h-20 overflow-y-auto">
                  {parseErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <EntryList entries={entries} />

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <RouletteWheel
                entries={entries}
                onWinnerSelected={handleWinnerSelected}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
              />
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && winner && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">Winners</h2>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Tagger</p>
                  <p className="text-xl font-semibold text-white">@{winner.tagger}</p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Tagged</p>
                  <p className="text-xl font-semibold text-white">@{winner.tagged}</p>
                </div>
              </div>

              <p className="text-white/60 text-sm mb-8">Both winners receive the prize</p>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 active:scale-95"
              >
                New Giveaway
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Winner Modal */}
      <WinnerDisplay winner={winner} onClose={handleReset} />
    </div>
  )
}
