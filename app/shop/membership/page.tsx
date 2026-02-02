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

const tierIcons = {
  collector: Star,
  curator: Zap,
  founding: Crown,
}

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
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
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
            Join the Collector's Circle
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Unlock exclusive benefits, earn credits that appreciate over time, 
            and get priority access to limited editions.
          </p>
          
          {cancelled && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              Checkout was cancelled. Select a tier below to try again.
            </div>
          )}

          {user?.isMember && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              You're already a {user.membershipTier} member!{' '}
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
                      ? 'bg-white shadow-2xl ring-2 ring-violet-500 scale-105' 
                      : 'bg-white shadow-lg hover:shadow-xl',
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
                      Current Plan
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
                      <span className="text-slate-500">/month</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {tier.monthlyCredits} credits/month (${tier.creditValueUsd} value)
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
                        Processing...
                      </>
                    ) : isCurrentTier ? (
                      'Current Plan'
                    ) : user?.isMember ? (
                      <>
                        Switch to {tier.name}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    ) : (
                      <>
                        Get Started
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
            Why Become a Member?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Credits That Grow
              </h3>
              <p className="text-slate-600">
                Your subscription credits appreciate over time. 
                Hold them longer, get more value.
              </p>
            </div>
            
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Early Access
              </h3>
              <p className="text-slate-600">
                Be first in line for limited edition drops 
                and exclusive releases.
              </p>
            </div>
            
            <div className="p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Member Pricing
              </h3>
              <p className="text-slate-600">
                Enjoy special pricing and promotions 
                available only to members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-slate-900 mb-2">
                How do credits work?
              </h3>
              <p className="text-slate-600">
                Credits are deposited monthly and can be used towards any purchase. 
                10 credits = $1 at checkout. Credits from your subscription appreciate 
                over time - hold them longer for bonus value!
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I change my tier?
              </h3>
              <p className="text-slate-600">
                Yes! You can upgrade or downgrade anytime. Upgrades are prorated and 
                include a bonus credit top-up. Downgrades take effect at the next 
                billing cycle.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-slate-900 mb-2">
                What happens to my credits if I cancel?
              </h3>
              <p className="text-slate-600">
                Your credits remain in your account even after cancellation. 
                You can use them anytime, though they won't appreciate without 
                an active subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user?.isMember && (
        <section className="py-16 px-4 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Collecting?
            </h2>
            <p className="text-slate-300 mb-8 text-lg">
              Join thousands of collectors and start building your collection today.
            </p>
            <Button
              onClick={() => handleSubscribe('curator')}
              disabled={isSubscribing}
              className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-lg font-semibold"
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start with Curator - Most Popular
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
