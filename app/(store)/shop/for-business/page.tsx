'use client'

import { useState, useRef } from 'react'
import {
  Container,
  SectionWrapper,
  Input,
  Textarea,
  Button,
} from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { MutedVideo } from '@/components/MutedVideo'
import { cn } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'

const CARD_VALUE_PRESETS = [
  '₪100',
  '₪300',
  '₪400',
  '₪600',
  '₪700',
  '₪900',
  '₪1,500',
]

type TabType = 'gifting' | 'hospitality' | 'offices' | 'galleries'

const businessContent = getStorePageContent('forBusiness')

export default function ForBusinessPage() {
  const [activeTab, setActiveTab] = useState<TabType>('gifting')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Gifting form state
  const [giftingState, setGiftingState] = useState({
    cardValue: '₪100',
    customCardValue: '',
    employeesCount: '',
    company: '',
    sendToday: true,
    sendDate: '',
    sendTime: 'now',
    giftMessage: '',
    emails: '',
    csvFile: null as File | null,
  })

  // Contact form state (Hospitality, Offices, Galleries)
  const [contactState, setContactState] = useState({
    name: '',
    companyName: '',
    desiredTiles: '',
    email: '',
    phone: '',
    additionalInfo: '',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGiftingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const formData = new FormData()
      formData.append('type', 'gifting')
      formData.append('cardValue', giftingState.cardValue || giftingState.customCardValue)
      formData.append('employeesCount', giftingState.employeesCount.trim())
      formData.append('company', giftingState.company.trim())
      formData.append('sendToday', String(giftingState.sendToday))
      formData.append('sendDate', giftingState.sendDate)
      formData.append('giftMessage', giftingState.giftMessage.trim())
      formData.append('emails', giftingState.emails.trim())
      if (giftingState.csvFile) formData.append('csvFile', giftingState.csvFile)

      const res = await fetch('/api/shop/for-business', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || businessContent.messages.errorFallback)
        return
      }
      setStatus('success')
      setGiftingState({
        cardValue: '₪100',
        customCardValue: '',
        employeesCount: '',
        company: '',
        sendToday: true,
        sendDate: '',
        sendTime: 'now',
        giftMessage: '',
        emails: '',
        csvFile: null,
      })
    } catch {
      setStatus('error')
      setErrorMessage(businessContent.messages.errorFallback)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/shop/for-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          name: contactState.name.trim(),
          companyName: contactState.companyName.trim(),
          desiredTiles: contactState.desiredTiles.trim(),
          email: contactState.email.trim(),
          phone: contactState.phone.trim(),
          additionalInfo: contactState.additionalInfo.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || businessContent.messages.errorFallback)
        return
      }
      setStatus('success')
      setContactState({
        name: '',
        companyName: '',
        desiredTiles: '',
        email: '',
        phone: '',
        additionalInfo: '',
      })
    } catch {
      setStatus('error')
      setErrorMessage(businessContent.messages.errorFallback)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero section: heading + description */}
      <SectionWrapper spacing="sm" background="default">
        <Container maxWidth="default" paddingX="gutter">
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-start mb-0">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em]">
              {businessContent.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {businessContent.hero.subtitle}
            </p>
          </div>
        </Container>
      </SectionWrapper>

      {/* Banner with video and clickable tab pills overlaid */}
      <div className="relative w-full">
        <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] min-h-[200px]">
          <MutedVideo
            src="https://cdn.shopify.com/videos/c/o/v/024d818562914184bbd79811b32e8efb.mp4"
            autoPlay
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Tab pills overlaid at bottom center */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2">
            {businessContent.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setStatus('idle')
                  setErrorMessage('')
                }}
                className={cn(
                  'px-6 py-3 rounded-[60px] font-medium text-white transition-all',
                  activeTab === tab.id
                    ? 'bg-background/90 text-foreground shadow-lg'
                    : 'bg-foreground/60 hover:bg-foreground/80 backdrop-blur-sm'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form content */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          {status === 'success' && (
            <ScrollReveal animation="fadeUp">
              <div className="rounded-xl bg-[#00a341]/10 border border-[#00a341]/30 p-8 text-center mb-10">
                <p className="text-lg font-medium text-[#00a341] mb-2">
                  {businessContent.messages.success.title}
                </p>
                <p className="text-muted-foreground">
                  {activeTab === 'gifting'
                    ? businessContent.messages.success.giftingBody
                    : businessContent.messages.success.contactBody}
                </p>
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'gifting' && (
            <ScrollReveal animation="fadeUp" duration={0.8}>
              <form onSubmit={handleGiftingSubmit} className="space-y-8 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    {businessContent.gifting.title}
                  </h2>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {businessContent.gifting.discountTiers.map((tier) => (
                      <div
                        key={tier.discount}
                        className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium"
                      >
                        {tier.discount}, {tier.minAmount}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    {businessContent.gifting.cardValueLabel}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CARD_VALUE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGiftingState((s) => ({ ...s, cardValue: preset, customCardValue: '' }))}
                        disabled={status === 'loading'}
                        className={cn(
                          'px-4 py-3 rounded-lg font-medium border-2 transition-colors',
                          giftingState.cardValue === preset
                            ? 'border-[#ec4899] bg-pink-50 text-foreground'
                            : 'border-border bg-background hover:border-border text-foreground'
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setGiftingState((s) => ({ ...s, cardValue: '', customCardValue: s.customCardValue || '' }))}
                      disabled={status === 'loading'}
                      className={cn(
                        'px-4 py-3 rounded-lg font-medium border-2 transition-colors',
                        !giftingState.cardValue
                          ? 'border-[#ec4899] bg-pink-50 text-foreground'
                          : 'border-border bg-background hover:border-border text-foreground'
                      )}
                    >
                      {businessContent.gifting.customCardValue.label}
                    </button>
                  </div>
                  {!giftingState.cardValue && (
                    <Input
                      placeholder={businessContent.gifting.customCardValue.placeholder}
                      value={giftingState.customCardValue}
                      onChange={(e) => setGiftingState((s) => ({ ...s, customCardValue: e.target.value }))}
                      disabled={status === 'loading'}
                      className="mt-2 max-w-[200px]"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      {businessContent.gifting.employeesLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={status === 'loading'}
                      className="text-sm text-experience-highlight hover:underline font-medium"
                    >
                      {businessContent.gifting.uploadCsvLabel}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) =>
                      setGiftingState((s) => ({
                        ...s,
                        csvFile: e.target.files?.[0] ?? null,
                      }))
                    }
                    className="hidden"
                  />
                  <textarea
                    placeholder={businessContent.gifting.emailsPlaceholder}
                    value={giftingState.emails}
                    onChange={(e) => setGiftingState((s) => ({ ...s, emails: e.target.value }))}
                    rows={5}
                    className="w-full rounded-[8px] border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-highlight focus-visible:border-transparent disabled:opacity-50"
                    disabled={status === 'loading'}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    label={businessContent.gifting.company.label}
                    placeholder={businessContent.gifting.company.placeholder}
                    value={giftingState.company}
                    onChange={(e) => setGiftingState((s) => ({ ...s, company: e.target.value }))}
                    disabled={status === 'loading'}
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {businessContent.gifting.sendWhenLabel}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={giftingState.sendToday ? 'today' : giftingState.sendDate || 'today'}
                        onChange={(e) => {
                          const v = e.target.value
                          setGiftingState((s) => ({
                            ...s,
                            sendToday: v === 'today',
                            sendDate: v === 'today' ? '' : v,
                          }))
                        }}
                        disabled={status === 'loading'}
                        className="flex-1 min-w-[120px] h-[2.625rem] sm:h-[3.125rem] px-4 rounded-[8px] border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-highlight"
                      >
                        <option value="today">{businessContent.gifting.sendTodayLabel}</option>
                        {Array.from({ length: 30 }, (_, i) => {
                          const d = new Date()
                          d.setDate(d.getDate() + i + 1)
                          return (
                            <option key={i} value={d.toISOString().slice(0, 10)}>
                              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </option>
                          )
                        })}
                      </select>
                      <select
                        value={giftingState.sendTime}
                        onChange={(e) => setGiftingState((s) => ({ ...s, sendTime: e.target.value }))}
                        disabled={status === 'loading'}
                        className="flex-1 min-w-[100px] h-[2.625rem] sm:h-[3.125rem] px-4 rounded-[8px] border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-highlight"
                      >
                        <option value="now">{businessContent.gifting.sendNowLabel}</option>
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {businessContent.gifting.giftMessage.label}
                  </label>
                  <textarea
                    placeholder={businessContent.gifting.giftMessage.placeholder}
                    value={giftingState.giftMessage}
                    onChange={(e) => setGiftingState((s) => ({ ...s, giftMessage: e.target.value }))}
                    rows={4}
                    className="w-full rounded-[8px] border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-highlight focus-visible:border-transparent disabled:opacity-50"
                    disabled={status === 'loading'}
                  />
                </div>

                {errorMessage && <p className="text-sm text-[#f83a3a]">{errorMessage}</p>}
                <Button type="submit" variant="primary" size="lg" disabled={status === 'loading'}>
                  {status === 'loading'
                    ? businessContent.gifting.submit.submitLoading
                    : businessContent.gifting.submit.submitIdle}
                </Button>
              </form>
            </ScrollReveal>
          )}

          {(activeTab === 'hospitality' || activeTab === 'offices' || activeTab === 'galleries') && (
            <ScrollReveal animation="fadeUp" duration={0.8}>
              <p className="text-muted-foreground mb-8">
                {businessContent.contact.intro}
              </p>
              <form onSubmit={handleContactSubmit} className="space-y-6 max-w-xl">
                <Input
                  label={businessContent.contact.fields.name.label}
                  required
                  placeholder={businessContent.contact.fields.name.placeholder}
                  value={contactState.name}
                  onChange={(e) => setContactState((s) => ({ ...s, name: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={businessContent.contact.fields.companyName.label}
                  required
                  placeholder={businessContent.contact.fields.companyName.placeholder}
                  value={contactState.companyName}
                  onChange={(e) => setContactState((s) => ({ ...s, companyName: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={businessContent.contact.fields.desiredTiles.label}
                  required
                  placeholder={businessContent.contact.fields.desiredTiles.placeholder}
                  value={contactState.desiredTiles}
                  onChange={(e) => setContactState((s) => ({ ...s, desiredTiles: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={businessContent.contact.fields.email.label}
                  type="email"
                  required
                  placeholder={businessContent.contact.fields.email.placeholder}
                  value={contactState.email}
                  onChange={(e) => setContactState((s) => ({ ...s, email: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={businessContent.contact.fields.phone.label}
                  type="tel"
                  placeholder={businessContent.contact.fields.phone.placeholder}
                  value={contactState.phone}
                  onChange={(e) => setContactState((s) => ({ ...s, phone: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Textarea
                  label={businessContent.contact.fields.additionalInfo.label}
                  placeholder={businessContent.contact.fields.additionalInfo.placeholder}
                  value={contactState.additionalInfo}
                  onChange={(e) => setContactState((s) => ({ ...s, additionalInfo: e.target.value }))}
                  disabled={status === 'loading'}
                  rows={5}
                />
                {errorMessage && <p className="text-sm text-[#f83a3a]">{errorMessage}</p>}
                <Button type="submit" variant="primary" size="lg" disabled={status === 'loading'}>
                  {status === 'loading'
                    ? businessContent.contact.submit.submitLoading
                    : businessContent.contact.submit.submitIdle}
                </Button>
              </form>
            </ScrollReveal>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
