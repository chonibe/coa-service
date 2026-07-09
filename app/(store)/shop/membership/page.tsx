'use client'

/**
 * Membership Marketing Page
 * 
 * Shows membership tiers, benefits, and allows users to subscribe.
 */

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { MEMBERSHIP_TIERS, type MembershipTierId, getAllTiers } from '@/lib/membership/tiers'
import { Check, Star, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'

const tierIcons = {
  collector: Star,
  curator: Zap,
  founding: Crown,
}

const membershipContent = getStorePageContent('membership')

function MembershipContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, isAuthenticated } = useShopAuthContext()
  const [selectedTier, setSelectedTier] = useState<MembershipTierId | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelled = searchParams.get('cancelled') === 'true'
  const tiers = getAllTiers()

  const handleSubscribe = async (tierId: MembershipTierId) => {
    setError(null)
    setSelectedTier(tierId)

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(`/auth/login?returnTo=/shop/membership&tier=${tierId}`)
      return
    }

    // If already a member, redirect to dashboard
    if (user?.isMember) {
      router.push('/collector/membership')
      return
    }

    setIsSubscribing(true)

    try {
      const response = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || membershipContent.notices.cancelled.body)
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || membershipContent.notices.cancelled.body)
      setIsSubscribing(false)
      setSelectedTier(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {membershipContent.hero.title}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {membershipContent.hero.subtitle}
          </p>
          
          {cancelled && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              {membershipContent.notices.cancelled.body}
            </div>
          )}

          {user?.isMember && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {membershipContent.notices.alreadyMember.body}{' '}
              <button 
                onClick={() => router.push('/collector/membership')}
                className="underline font-medium"
              >
                Manage your membership
              </button>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => {
              const Icon = tierIcons[tier.id]
              const isSelected = selectedTier === tier.id
              const isCurrentTier = user?.membershipTier === tier.id

              return (
                <div
                  key={tier.id}
                  className={cn(
                    'relative rounded-2xl p-8 transition-all duration-300',
                    tier.highlighted 
                      ? 'bg-card shadow-2xl ring-2 ring-violet-500 scale-105' 
                      : 'bg-card shadow-lg hover:shadow-xl',
                    isCurrentTier && 'ring-2 ring-green-500'
                  )}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className={cn(
                      'absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white',
                      tier.id === 'founding' ? 'bg-amber-500' : 'bg-violet-500'
                    )}>
                      {tier.badge}
                    </div>
                  )}

                  {isCurrentTier && (
                    <div className="absolute -top-4 right-4 px-4 py-1 rounded-full text-sm font-semibold text-white bg-green-500">
                      {membershipContent.labels.currentPlan}
                    </div>
                  )}

                  {/* Header */}
                  <div className="text-center mb-6">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: `${tier.color}20` }}
                    >
                      <Icon 
                        className="w-8 h-8" 
                        style={{ color: tier.color }} 
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-slate-500 mt-2">{tier.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        ${tier.priceMonthly}
                      </span>
                      <span className="text-slate-500">{membershipContent.labels.priceSuffix}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {membershipContent.labels.creditsPerMonth(tier.monthlyCredits, tier.creditValueUsd)}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check 
                          className="w-5 h-5 mt-0.5 flex-shrink-0" 
                          style={{ color: tier.color }} 
                        />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={isSubscribing || isCurrentTier}
                    className={cn(
                      'w-full py-6 text-lg font-semibold transition-all',
                      tier.highlighted 
                        ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    )}
                    style={tier.highlighted ? {} : { backgroundColor: tier.color }}
                  >
                    {isSelected && isSubscribing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {membershipContent.labels.processing}
                      </>
                    ) : isCurrentTier ? (
                      membershipContent.labels.currentPlanBadge
                    ) : user?.isMember ? (
                      <>
                        {membershipContent.labels.switchToTier(tier.name)}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    ) : (
                      <>
                        {membershipContent.finalCta.buttonLabel}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-slate-50 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            {membershipContent.benefits.title}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {membershipContent.benefits.items[0]?.title}
              </h3>
              <p className="text-slate-600">
                {membershipContent.benefits.items[0]?.body}
              </p>
            </div>
            
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {membershipContent.benefits.items[1]?.title}
              </h3>
              <p className="text-slate-600">
                {membershipContent.benefits.items[1]?.body}
              </p>
            </div>
            
            <div className="p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {membershipContent.benefits.items[2]?.title}
              </h3>
              <p className="text-slate-600">
                {membershipContent.benefits.items[2]?.body}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {membershipContent.faq.title}
          </h2>
          
          <div className="space-y-6">
            {membershipContent.faq.items.map((item) => (
              <div key={item.question} className="bg-card p-6 rounded-lg shadow">
                <h3 className="font-semibold text-slate-900 mb-2">{item.question}</h3>
                <p className="text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user?.isMember && (
        <section className="py-16 px-4 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              {membershipContent.finalCta.title}
            </h2>
            <p className="text-slate-300 mb-8 text-lg">
              {membershipContent.finalCta.body}
            </p>
            <Button
              onClick={() => handleSubscribe('curator')}
              disabled={isSubscribing}
              className="bg-card text-foreground hover:bg-muted px-8 py-6 text-lg font-semibold"
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {membershipContent.labels.processing}
                </>
              ) : (
                <>
                  {membershipContent.finalCta.buttonLabel}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

// Loading fallback
function MembershipLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse text-center">
          <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

// Main export wrapped in Suspense
export default function MembershipPage() {
  return (
    <Suspense fallback={<MembershipLoading />}>
      <MembershipContent />
    </Suspense>
  )
}
