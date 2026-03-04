'use client'

import { useState } from 'react'
import { Gift, Loader2, ChevronRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { cn } from '@/lib/utils'

const PRESET_AMOUNTS = [
  { label: '$25', cents: 2500 },
  { label: '$50', cents: 5000 },
  { label: '$100', cents: 10000 },
  { label: '$200', cents: 20000 },
]

const MIN_CENTS = 1000
const MAX_CENTS = 50000

export default function GiftCardsPage() {
  const { user, isAuthenticated } = useShopAuthContext()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customCents = customAmount ? Math.round(parseFloat(customAmount) * 100) : 0
  const amountCents = selectedAmount ?? (customCents >= MIN_CENTS ? customCents : 0)
  const isValidAmount = amountCents >= MIN_CENTS && amountCents <= MAX_CENTS

  const handleBuy = async () => {
    if (!isValidAmount) {
      setError(`Amount must be between $${MIN_CENTS / 100} and $${MAX_CENTS / 100}`)
      return
    }

    setError(null)
    setIsCheckingOut(true)

    try {
      const res = await fetch('/api/gift-cards/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: amountCents,
          recipientEmail: recipientEmail.trim() || undefined,
          customerEmail: isAuthenticated && user?.email ? user.email : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setIsCheckingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <section className="max-w-xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-950 dark:text-white text-center">
            Buy a Gift Card
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-center">
            Give the gift of art. Digital gift cards redeemable at checkout.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Choose amount
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map(({ label, cents }) => (
                <button
                  key={cents}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(cents)
                    setCustomAmount('')
                  }}
                  className={cn(
                    'py-3 px-4 rounded-lg border-2 text-center font-semibold transition-colors',
                    selectedAmount === cents
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 text-neutral-900 dark:text-white'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="custom-amount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Or enter custom amount ($10 – $500)
            </label>
            <Input
              id="custom-amount"
              type="number"
              min="10"
              max="500"
              step="1"
              placeholder="e.g. 75"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedAmount(null)
              }}
              className="dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white"
            />
          </div>

          <div>
            <label htmlFor="recipient-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Send to recipient (optional)
            </label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Leave blank to send the code to your email
            </p>
          </div>

          <Button
            onClick={handleBuy}
            disabled={!isValidAmount || isCheckingOut}
            className="w-full py-4 text-lg font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Buy Gift Card — ${(amountCents / 100).toFixed(2)}
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-10 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">How it works</h3>
          <ol className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 list-decimal list-inside">
            <li>Choose your amount and complete checkout</li>
            <li>Receive your unique gift card code by email</li>
            <li>Redeem at checkout: add items, then enter the code in &quot;Add Promo Code or Gift Card&quot;</li>
          </ol>
        </div>
      </section>
    </main>
  )
}
