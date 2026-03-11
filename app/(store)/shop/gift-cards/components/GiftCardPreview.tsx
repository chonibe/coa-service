'use client'

import { cn } from '@/lib/utils'

const designStyles = {
  classic: {
    card: 'bg-gradient-to-br from-neutral-800 to-neutral-950 border-2 border-amber-600/40 shadow-xl',
    accent: 'border-amber-500/60',
    text: 'text-amber-50',
    amount: 'text-amber-400 font-serif',
  },
  minimal: {
    card: 'bg-white border-2 border-neutral-200 shadow-lg',
    accent: 'border-neutral-300',
    text: 'text-neutral-800',
    amount: 'text-neutral-950 font-semibold',
  },
  festive: {
    card: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 border-2 border-emerald-400/50 shadow-xl',
    accent: 'border-emerald-400/60',
    text: 'text-emerald-50',
    amount: 'text-emerald-300 font-serif',
  },
} as const

export interface GiftCardPreviewProps {
  design: 'classic' | 'minimal' | 'festive'
  amountDollars: string
  giftMessage?: string
  senderName?: string
  className?: string
}

export function GiftCardPreview({
  design,
  amountDollars,
  giftMessage,
  senderName,
  className,
}: GiftCardPreviewProps) {
  const s = designStyles[design]

  return (
    <div
      className={cn(
        'relative aspect-[1.586/1] max-w-sm w-full rounded-2xl overflow-hidden',
        s.card,
        s.accent,
        className
      )}
      style={{ aspectRatio: '1.586 / 1' }}
    >
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="100" cy="0" r="80" fill="currentColor" />
        </svg>
      </div>

      <div className={cn('relative h-full flex flex-col justify-between p-6', s.text)}>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-80 mb-2">
            The Street Collector
          </p>
          <p className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
            Gift Card
          </p>
        </div>

        <div className="space-y-3">
          <p className={cn('text-4xl md:text-5xl', s.amount)}>
            {amountDollars}
          </p>
          {senderName && (
            <p className="text-sm opacity-90">
              From {senderName}
            </p>
          )}
          {giftMessage && (
            <p className="text-sm opacity-90 line-clamp-2 italic">
              &ldquo;{giftMessage}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="h-px flex-1 bg-current opacity-30" />
          <span className="text-[10px] uppercase tracking-wider opacity-60">
            Never expires
          </span>
        </div>
      </div>
    </div>
  )
}
