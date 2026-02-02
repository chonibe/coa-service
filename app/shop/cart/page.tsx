'use client'

/**
 * Shopping Cart Page
 * 
 * Shows cart items with credit slider for members to apply credits.
 */

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/shop/CartContext'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { Button, Slider } from '@/components/ui'
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Loader2, 
  CreditCard,
  Coins,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

function CartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    creditsToUse, 
    setCreditsToUse,
    creditsDiscount,
    total,
    isEmpty,
    clearCart,
  } = useCart()
  const { user, loading: authLoading, canUseCredits } = useShopAuthContext()
  
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelled = searchParams.get('cancelled') === 'true'
  const availableCredits = user?.creditBalance || 0
  const maxCreditsForCart = Math.min(availableCredits, subtotal * 10) // 10 credits per $1

  const handleCheckout = async () => {
    setError(null)
    setIsCheckingOut(true)

    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            variantGid: `gid://shopify/ProductVariant/${item.variantId}`,
            handle: item.handle,
            title: item.title,
            variantTitle: item.variantTitle,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            artistName: item.artistName,
          })),
          creditsToUse: creditsToUse,
          customerEmail: user?.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Handle different checkout types
      if (data.type === 'credit_only') {
        // For credit-only purchases, redirect to complete endpoint
        router.push(data.completeUrl)
      } else {
        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setIsCheckingOut(false)
    }
  }

  if (isEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-8">Add some artwork to get started!</p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

      {cancelled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          Checkout was cancelled. Your cart items are still here.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div 
              key={item.id}
              className="flex gap-4 p-4 bg-white rounded-lg border border-slate-200"
            >
              {/* Image */}
              <div className="relative w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/shop/${item.handle}`}
                  className="font-semibold text-slate-900 hover:text-slate-600 line-clamp-1"
                >
                  {item.title}
                </Link>
                {item.variantTitle && (
                  <p className="text-sm text-slate-500">{item.variantTitle}</p>
                )}
                {item.artistName && (
                  <p className="text-sm text-slate-500">by {item.artistName}</p>
                )}
                <p className="font-semibold text-slate-900 mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-slate-500 hover:text-red-500"
          >
            Clear cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Order Summary
            </h2>

            {/* Subtotal */}
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>

            {/* Credit Slider - Only for members with credits */}
            {canUseCredits() && availableCredits > 0 && (
              <div className="py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Use Credits
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {availableCredits.toLocaleString()} available
                  </span>
                </div>
                
                <Slider
                  value={[creditsToUse]}
                  onValueChange={([value]) => setCreditsToUse(value)}
                  max={maxCreditsForCart}
                  step={10}
                  className="my-4"
                />
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Using {creditsToUse.toLocaleString()} credits
                  </span>
                  <span className="text-green-600 font-medium">
                    -${creditsDiscount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Non-member credit promo */}
            {!user?.isMember && (
              <div className="py-4 border-b border-slate-100">
                <div className="bg-violet-50 rounded-lg p-3">
                  <p className="text-sm text-violet-800 font-medium mb-1">
                    Become a member to earn credits!
                  </p>
                  <p className="text-xs text-violet-600">
                    Members earn credits that appreciate over time.
                  </p>
                  <Link href="/shop/membership">
                    <Button 
                      variant="link" 
                      className="text-violet-700 p-0 h-auto text-xs mt-1"
                    >
                      Learn more
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Credits discount */}
            {creditsDiscount > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>Credits discount</span>
                <span className="font-medium">-${creditsDiscount.toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between py-4 text-lg font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-6 text-lg"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : total === 0 ? (
                <>
                  <Coins className="w-5 h-5 mr-2" />
                  Pay with Credits
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Checkout ${total.toFixed(2)}
                </>
              )}
            </Button>

            {total === 0 && creditsToUse > 0 && (
              <p className="text-xs text-center text-slate-500 mt-2">
                Your entire order is covered by credits!
              </p>
            )}

            {/* Continue Shopping */}
            <Link href="/shop" className="block mt-4">
              <Button variant="outline" className="w-full">
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback for cart page
function CartLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export wrapped in Suspense
export default function CartPage() {
  return (
    <Suspense fallback={<CartLoading />}>
      <CartContent />
    </Suspense>
  )
}
