'use client'

import { useState, useEffect } from 'react'
import { Gift, Loader2, ChevronRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { GiftCardCheckoutDrawer } from './components/GiftCardCheckoutDrawer'
import { GiftCardPreview } from './components/GiftCardPreview'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { cn } from '@/lib/utils'

const PRESET_AMOUNTS = [
  { label: '$25', cents: 2500 },
  { label: '$50', cents: 5000 },
  { label: '$100', cents: 10000 },
  { label: '$200', cents: 20000 },
]

const GIFT_CARD_DESIGNS = [
  { id: 'classic', label: 'Classic' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'festive', label: 'Festive' },
]

const MIN_CENTS = 10 // $0.10 (for testing)
const MAX_CENTS = 50000
const SEASON1_ARTWORK_CENTS = 4000 // $40

type GiftCardType = 'value' | 'street_lamp' | 'season1_artwork'

export default function GiftCardsPage() {
  const { user, isAuthenticated } = useShopAuthContext()
  const [giftCardType, setGiftCardType] = useState<GiftCardType>('value')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [design, setDesign] = useState('classic')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [sendToday, setSendToday] = useState(true)
  const [sendDate, setSendDate] = useState('')
  const [senderName, setSenderName] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lampPrice, setLampPrice] = useState<number | null>(null)
  const [checkoutDrawerOpen, setCheckoutDrawerOpen] = useState(false)
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null)
  const [checkoutLineLabel, setCheckoutLineLabel] = useState('')

  const customCents = customAmount ? Math.round(parseFloat(customAmount) * 100) : 0
  const amountCents =
    giftCardType === 'value'
      ? selectedAmount ?? (customCents >= MIN_CENTS ? customCents : 0)
      : giftCardType === 'street_lamp'
        ? lampPrice ? Math.round(lampPrice * 100) : 0
        : SEASON1_ARTWORK_CENTS

  const isValid =
    giftCardType === 'value'
      ? amountCents >= MIN_CENTS && amountCents <= MAX_CENTS
      : giftCardType === 'street_lamp'
        ? lampPrice != null && lampPrice > 0
        : true

  const sendAt = sendToday ? null : sendDate ? new Date(sendDate).toISOString() : null

  useEffect(() => {
    if (giftCardType === 'street_lamp') {
      fetch('/api/gift-cards/lamp-price')
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.price === 'number') setLampPrice(data.price)
        })
        .catch(() => setLampPrice(null))
    } else {
      setLampPrice(null)
    }
  }, [giftCardType])

  const handleBuy = async () => {
    if (!recipientEmail?.trim()) {
      setError('Please enter the recipient\'s email')
      return
    }
    if (!sendToday && !sendDate) {
      setError('Please select a date to send the gift card')
      return
    }
    if (!isValid) {
      setError(
        giftCardType === 'value'
          ? `Amount must be between $${(MIN_CENTS / 100).toFixed(1)} and $${(MAX_CENTS / 100).toFixed(0)}`
          : giftCardType === 'street_lamp'
            ? 'Street Lamp price not available. Please try again.'
            : 'Please fill in required fields.'
      )
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
          giftCardType: giftCardType,
          recipientEmail: recipientEmail.trim() || undefined,
          customerEmail: isAuthenticated && user?.email ? user.email : undefined,
          design,
          giftMessage: giftMessage.trim() || undefined,
          sendAt: sendAt || undefined,
          senderName: senderName.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.clientSecret) {
        const label =
          giftCardType === 'street_lamp'
            ? 'Gift Card: 1 Street Lamp'
            : giftCardType === 'season1_artwork'
              ? 'Gift Card: 1 Season 1 Artwork ($40)'
              : `Gift Card - $${(amountCents / 100).toFixed(2)}`
        setCheckoutLineLabel(label)
        setCheckoutClientSecret(data.clientSecret)
        setCheckoutDrawerOpen(true)
      } else {
        throw new Error('No checkout session returned')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleCheckoutSuccess = (redirectUrl: string) => {
    window.location.href = redirectUrl
  }

  const amountDollars =
    giftCardType === 'value'
      ? (amountCents / 100).toFixed(2)
      : giftCardType === 'street_lamp'
        ? lampPrice != null ? lampPrice.toFixed(2) : '0.00'
        : '40.00'

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <section className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-neutral-700 dark:text-[#d4b8b8]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-950 dark:text-[#f0e8e8] text-center">
            Digital Gift Card
          </h1>
          <p className="text-neutral-600 dark:text-[#c4a0a0] mt-2 text-center">
            Who&apos;s the lucky recipient?
          </p>
        </div>

        {error && (
          <div className="mb-6 max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* Selector column - order-2 on mobile so card preview shows first */}
          <div className="space-y-6 order-2 lg:order-none">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-2">
              Recipient&apos;s email
            </label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-3">
              Choose a design
            </label>
            <div className="flex gap-3">
              {GIFT_CARD_DESIGNS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDesign(d.id)}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors',
                    design === d.id
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515]'
                      : 'border-neutral-200 dark:border-[#3e3838] hover:border-neutral-400 dark:hover:border-[#4a4444] text-neutral-900 dark:text-[#f0e8e8]'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 dark:text-[#c4a0a0] mt-1">
              Preview updates as you customize
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-3">
              Choose a card value
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGiftCardType('value')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium',
                    giftCardType === 'value'
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515]'
                      : 'border-neutral-200 dark:border-[#3e3838]'
                  )}
                >
                  Dollar amount
                </button>
                <button
                  type="button"
                  onClick={() => setGiftCardType('street_lamp')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium',
                    giftCardType === 'street_lamp'
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515]'
                      : 'border-neutral-200 dark:border-[#3e3838]'
                  )}
                >
                  1 Street Lamp
                </button>
                <button
                  type="button"
                  onClick={() => setGiftCardType('season1_artwork')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium',
                    giftCardType === 'season1_artwork'
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515]'
                      : 'border-neutral-200 dark:border-[#3e3838]'
                  )}
                >
                  1 Season 1 Artwork ($40)
                </button>
              </div>

              {giftCardType === 'value' && (
                <>
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
                            ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515]'
                            : 'border-neutral-200 dark:border-[#3e3838] hover:border-neutral-400 dark:hover:border-[#4a4444] text-neutral-900 dark:text-[#f0e8e8]'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    min="0.1"
                    max="500"
                    step="0.1"
                    placeholder="Or custom amount ($0.10 – $500)"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setSelectedAmount(null)
                    }}
                    className="dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white"
                  />
                </>
              )}

              {giftCardType === 'street_lamp' && (
                <p className="text-sm text-neutral-500 dark:text-[#c4a0a0]">
                  {lampPrice != null
                    ? `$${lampPrice.toFixed(2)} — Redeemable for 1 Street Lamp`
                    : 'Loading price...'}
                </p>
              )}

              {giftCardType === 'season1_artwork' && (
                <p className="text-sm text-neutral-500 dark:text-[#c4a0a0]">
                  $40.00 — Redeemable for any Season 1 artwork
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="gift-message" className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-2">
              Gift message (optional)
            </label>
            <textarea
              id="gift-message"
              placeholder="Add a personal note"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-[#3e3838] bg-white dark:bg-[#1a1616] px-4 py-3 text-neutral-900 dark:text-[#f0e8e8] placeholder:text-[#b89090]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-2">
              When should we send the gift card?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="send-when"
                  checked={sendToday}
                  onChange={() => setSendToday(true)}
                  className="rounded-full"
                />
                <span>Today</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="send-when"
                  checked={!sendToday}
                  onChange={() => setSendToday(false)}
                  className="rounded-full"
                />
                <span>Schedule</span>
              </label>
            </div>
            {!sendToday && (
              <Input
                type="date"
                value={sendDate}
                onChange={(e) => setSendDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                className="mt-2 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white"
              />
            )}
          </div>

          <div>
            <label htmlFor="sender-name" className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-2">
              Who is it from?
            </label>
            <Input
              id="sender-name"
              type="text"
              placeholder="Sender's name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white"
            />
          </div>

          <Button
            onClick={handleBuy}
            disabled={
              !recipientEmail?.trim() ||
              (!sendToday && !sendDate) ||
              !isValid ||
              isCheckingOut
            }
            className="w-full py-4 text-lg font-semibold bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515] hover:bg-neutral-800 dark:hover:bg-[#e8d4d4]"
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

          {/* Preview column - order-1 on mobile so card shows at top */}
          <div className="lg:sticky lg:top-24 order-1 lg:order-none">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-neutral-600 dark:text-[#c4a0a0] mb-4">
                Card preview
              </p>
              <GiftCardPreview
                design={design}
                amountDollars={`$${amountDollars}`}
                giftMessage={giftMessage || undefined}
                senderName={senderName || undefined}
                className="shadow-2xl"
              />
              <p className="mt-4 text-xs text-neutral-500 dark:text-[#c4a0a0] text-center max-w-xs">
                Delivered by email, this gift card never expires.
              </p>
            </div>
          </div>
        </div>

        {checkoutClientSecret && (
          <GiftCardCheckoutDrawer
            open={checkoutDrawerOpen}
            onClose={() => {
              setCheckoutDrawerOpen(false)
              setCheckoutClientSecret(null)
            }}
            clientSecret={checkoutClientSecret}
            amountCents={amountCents}
            lineItemLabel={checkoutLineLabel}
            customerEmail={isAuthenticated && user?.email ? user.email : undefined}
            onSuccess={handleCheckoutSuccess}
            onError={(msg) => setError(msg)}
          />
        )}

        <div className="mt-10 p-4 rounded-lg bg-neutral-50 dark:bg-[#201c1c]/50">
          <h3 className="font-semibold text-neutral-900 dark:text-[#f0e8e8] mb-2">How it works</h3>
          <ol className="text-sm text-neutral-600 dark:text-[#c4a0a0] space-y-1 list-decimal list-inside">
            <li>Complete checkout and we&apos;ll email the unique code {sendToday ? '' : 'on your chosen date'}
            </li>
            <li>Recipient enters the code in &quot;Add Promo Code or Gift Card&quot; at checkout</li>
          </ol>
        </div>
      </section>
    </main>
  )
}
