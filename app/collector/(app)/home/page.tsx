'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { ProgressRing } from '@/components/app-shell'
import { Gem, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Home Tab
//
// The shop feed — personalized for the collector.
// Shows artworks, new releases, recent purchases, and gamification prompts.
// Feels like you never left the store.
// ============================================================================

interface ShopProduct {
  id: string
  title: string
  handle: string
  imageUrl?: string
  price: string
  compareAtPrice?: string
  vendorName?: string
  available: boolean
}

interface RecentPurchase {
  name: string
  imageUrl?: string
  authenticated: boolean
  orderId: string
}

export default function CollectorHomePage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [purchases, setPurchases] = useState<RecentPurchase[]>([])
  const [stats, setStats] = useState<{ level: number; creditsBalance: number; xpProgress: number }>({
    level: 1,
    creditsBalance: 0,
    xpProgress: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch shop products
        const productsRes = await fetch('/api/shop/products?limit=8')
        const productsJson = await productsRes.json()
        if (productsJson.products) {
          setProducts(
            productsJson.products.map((p: any) => ({
              id: p.id,
              title: p.title,
              handle: p.handle,
              imageUrl: p.images?.[0]?.src || p.image?.src || p.featuredImage?.url,
              price: p.variants?.[0]?.price || p.priceRange?.minVariantPrice?.amount || '0',
              compareAtPrice: p.variants?.[0]?.compare_at_price || undefined,
              vendorName: p.vendor,
              available: p.available !== false,
            }))
          )
        }
      } catch (err) {
        console.error('[Home] Failed to fetch products:', err)
      }

      try {
        // Fetch collector dashboard for recent purchases + stats
        const dashRes = await fetch('/api/collector/dashboard')
        const dashJson = await dashRes.json()
        if (dashJson.success) {
          const orders = dashJson.orders || []
          const recentItems: RecentPurchase[] = []
          for (const order of orders.slice(0, 3)) {
            for (const item of order.order_line_items_v2 || []) {
              recentItems.push({
                name: item.name,
                imageUrl: item.img_url,
                authenticated: !!item.nfc_claimed_at,
                orderId: order.id,
              })
            }
          }
          setPurchases(recentItems.slice(0, 6))

          const totalCreditsEarned = dashJson.banking?.totalCreditsEarned || dashJson.banking?.credits_earned || 0
          const balance = dashJson.banking?.credits_balance || dashJson.banking?.creditsBalance || 0
          const level = Math.floor(Math.sqrt(totalCreditsEarned / 50)) + 1
          const currentLevelCredits = (level - 1) ** 2 * 50
          const nextLevelCredits = level ** 2 * 50
          const xpProgress = nextLevelCredits > currentLevelCredits
            ? ((totalCreditsEarned - currentLevelCredits) / (nextLevelCredits - currentLevelCredits)) * 100
            : 100

          setStats({ level, creditsBalance: balance, xpProgress: Math.min(xpProgress, 100) })
        }
      } catch (err) {
        console.error('[Home] Failed to fetch dashboard:', err)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-5 pb-6">
      {/* Status bar — level + credits (gamification always visible) */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#390000] to-[#5a1a1a] rounded-impact-block-sm">
          <ProgressRing
            progress={stats.xpProgress}
            size={40}
            strokeWidth={2.5}
            color="#ffba94"
            trackColor="rgba(255,186,148,0.2)"
          >
            <Sparkles className="w-4 h-4 text-[#ffba94]" />
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#ffba94] font-body">Level {stats.level}</p>
            <div className="h-1 bg-[#ffba94]/20 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-[#ffba94] rounded-full transition-all duration-700"
                style={{ width: `${stats.xpProgress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffba94]/15">
            <Gem className="w-3 h-3 text-[#ffba94]" />
            <span className="text-xs font-bold text-[#ffba94] font-body">
              {stats.creditsBalance >= 1000
                ? `${(stats.creditsBalance / 1000).toFixed(1)}k`
                : stats.creditsBalance}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      {purchases.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-sm font-bold text-gray-900 font-body">Your Recent Purchases</h2>
            <Link
              href="/collector/collection"
              className="text-xs font-semibold text-impact-primary font-body flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none">
            {purchases.map((item, i) => (
              <div key={i} className="shrink-0 w-28">
                <div className="relative aspect-[4/5] rounded-impact-block-xs overflow-hidden bg-gray-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                  {item.authenticated && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-impact-success flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-body text-gray-700 mt-1.5 truncate">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Products — New Releases */}
      <div>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-gray-900 font-body">New Releases</h2>
          <Link
            href="/shop"
            className="text-xs font-semibold text-impact-primary font-body flex items-center gap-1"
          >
            Shop all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 rounded-impact-block-xs" />
                <div className="h-3 bg-gray-100 rounded mt-2 w-3/4" />
                <div className="h-3 bg-gray-100 rounded mt-1 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="px-4">
            <ContentCard padding="lg">
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-body">No products available right now</p>
              </div>
            </ContentCard>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {products.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                href={`/shop/products/${product.handle}`}
                className="group"
              >
                <div className="relative aspect-[4/5] rounded-impact-block-xs overflow-hidden bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-impact-error text-white text-[10px] font-bold">
                      Sale
                    </span>
                  )}
                  {!product.available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold font-body uppercase tracking-wider">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-900 font-body truncate group-hover:text-impact-primary transition-colors">
                    {product.title}
                  </p>
                  {product.vendorName && (
                    <p className="text-[11px] text-gray-500 font-body truncate">{product.vendorName}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-gray-900 font-body">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                      <span className="text-[10px] text-gray-400 line-through font-body">
                        ${parseFloat(product.compareAtPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
