"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ShieldCheck, Timer, Wallet, Wand2, 
  Award, DollarSign, LayoutGrid, ArrowLeft,
  Share2, MoreHorizontal, History as HistoryIcon, Heart,
  ExternalLink, ShoppingBag
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ArtworkGrid } from "./components/artwork-grid"
import { ArtistList } from "./components/artist-list"
import { SeriesBinder } from "./components/series-binder"
import { AuthenticationQueue } from "./components/authentication-queue"
import { CreditsPanel } from "./components/credits-panel"
import { DashboardTabs } from "./components/dashboard-tabs"
import { PurchasesSection } from "./components/purchases-section"
import { EditionsGallery } from "./components/editions-gallery"
import { ArtistsCollection } from "./components/artists-collection"
import { CertificationsHub } from "./components/certifications-hub"
import { HiddenContentComponent } from "./components/hidden-content"
import { ProfileSection } from "./components/profile-section"
import { InkOGatchiWidget } from "./components/inkogatchi-widget"
import { PremiumProfileHero } from "./components/premium/PremiumProfileHero"
import { PremiumStatsGrid } from "./components/premium/PremiumStatsGrid"
import { PremiumOrderCard } from "./components/premium/PremiumOrderCard"
import { PremiumExpandedStackModal } from "./components/premium/PremiumExpandedStackModal"
import type { CollectorEdition, CollectorCertification, HiddenContent, ArtistCollectionStats } from "@/types/collector"

type ApiResponse = {
  success: boolean
  orders: Array<{
    id: string
    orderNumber: number
    processedAt: string
    totalPrice: number
    financialStatus: string | null
    fulfillmentStatus: string | null
    lineItems: any[]
  }>
  artists: any[]
  series: any[]
  stats: {
    totalOrders: number
    totalArtworksOwned: number
    authenticatedCount: number
    unauthenticatedCount: number
    certificatesReady: number
  }
  collectorIdentifier: string | null
  banking: any
  subscriptions: any
  purchasesByArtist?: Record<string, any[]>
  purchasesBySeries?: Record<string, { series: any; items: any[] }>
  hiddenContent?: HiddenContent
  certifications?: CollectorCertification[]
  artistStats?: ArtistCollectionStats[]
}

export default function CollectorDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editions, setEditions] = useState<CollectorEdition[]>([])
  const [certifications, setCertifications] = useState<CollectorCertification[]>([])
  const [hiddenContent, setHiddenContent] = useState<HiddenContent | null>(null)
  const [avatar, setAvatar] = useState<any>(null)
  const [expandedGroup, setExpandedGroup] = useState<any[] | null>(null)
  const [groupingMode, setGroupingMode] = useState<'product' | 'artist'>('product')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const [dashboardRes, editionsRes, certificationsRes, hiddenContentRes, avatarRes, authStatusRes] = await Promise.all([
          fetch("/api/collector/dashboard", { credentials: "include" }),
          fetch("/api/collector/editions", { credentials: "include" }),
          fetch("/api/collector/certifications", { credentials: "include" }),
          fetch("/api/collector/hidden-content", { credentials: "include" }),
          fetch("/api/collector/avatar", { credentials: "include" }),
          fetch("/api/auth/status", { credentials: "include" }),
        ])

        if (!dashboardRes.ok) {
          const payload = await dashboardRes.json().catch(() => ({}))
          throw new Error(payload.message || "Failed to load collector dashboard")
        }

        const dashboardData = (await dashboardRes.json()) as ApiResponse
        setData(dashboardData)

        // Load additional data
        if (editionsRes.ok) {
          const editionsData = await editionsRes.json()
          if (editionsData.success) {
            setEditions(editionsData.editions || [])
          }
        }

        if (certificationsRes.ok) {
          const certData = await certificationsRes.json()
          if (certData.success) {
            setCertifications(certData.certifications || [])
          }
        }

        if (hiddenContentRes.ok) {
          const hiddenData = await hiddenContentRes.json()
          if (hiddenData.success) {
            setHiddenContent(hiddenData.hiddenContent || { hiddenSeries: [], bonusContent: [] })
          }
        }

        if (avatarRes.ok) {
          const avatarData = await avatarRes.json()
          if (avatarData.success) {
            setAvatar(avatarData.avatar)
          }
        }

        // If account selection is required (e.g. after logout), redirect to login
        if (authStatusRes.ok) {
          const authData = await authStatusRes.json()
          setIsAdmin(authData.isAdmin || false)
          if (authData.requireAccountSelection === true) {
            router.replace("/login")
            return
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load collector dashboard")
        // If missing session, bounce to login
        if (err.message?.toLowerCase().includes("session")) {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router])

  const lineItems = useMemo(() => data?.orders.flatMap((o) => o.lineItems) ?? [], [data])
  const pendingAuth = useMemo(
    () =>
      lineItems
        .filter((li) => li.nfcTagId && !li.nfcClaimedAt)
        .map((li) => ({
          id: li.id,
          name: li.name,
          vendorName: li.vendorName,
          seriesName: li.series?.name,
          nfcTagId: li.nfcTagId,
          certificateUrl: li.certificateUrl,
        })),
    [lineItems],
  )

  const stats = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Active Collection', value: data.stats.totalArtworksOwned, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Market Value', value: formatCurrency(lineItems.reduce((sum, li) => sum + (li.price || 0), 0), 'USD'), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Total Acquisitions', value: data.stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Items Tracked', value: lineItems.length, icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]
  }, [data, lineItems])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Unable to load dashboard</AlertTitle>
          <AlertDescription>{error || "Something went wrong"}</AlertDescription>
        </Alert>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/api/auth/shopify?redirect=/collector/dashboard" className="inline-flex">
            <Badge variant="outline" className="px-3 py-2">Sign in with Shopify</Badge>
          </a>
          <a href="/api/auth/shopify/google/start" className="inline-flex">
            <Badge variant="secondary" className="px-3 py-2">Continue with Google</Badge>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]/50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Collector Dashboard</span>
              <h2 className="text-lg font-black text-slate-900 leading-tight tracking-tight">Your collection binder</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && data?.collectorIdentifier && (
              <Link href={`/admin/collectors/${data.collectorIdentifier}`}>
                <Button variant="outline" size="sm" className="rounded-full font-bold text-xs px-4 h-9">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Admin View
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" className="rounded-full font-bold text-xs px-4 h-9">
              <Share2 className="h-3.5 w-3.5 mr-2" /> Share
            </Button>
            <Button variant="default" size="sm" className="rounded-full font-bold text-xs px-4 h-9 shadow-lg shadow-primary/20">
              Actions <MoreHorizontal className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Profile & Identity */}
          <div className="lg:col-span-4 space-y-6">
            <PremiumProfileHero 
              profile={data.profile || { 
                display_name: "Collector", 
                user_email: data.collectorIdentifier ? `ID: ${data.collectorIdentifier.slice(0, 8)}` : "Guest",
                avatar_url: null
              }} 
              avatar={avatar} 
            />
          </div>

          {/* RIGHT PANEL: Experience & Activity */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Stats Grid */}
            <PremiumStatsGrid stats={stats} />

            {/* Interactive Activity Section */}
            <div className="space-y-6">
              <DashboardTabs>
                {{
                  overview: (
                    <div className="space-y-8">
                      <InkOGatchiWidget userId={avatar?.user_id} email={avatar?.user_email} />
                      
                      <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                          <HistoryIcon className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="space-y-4">
                          {data.orders.slice(0, 5).map((order) => (
                            <PremiumOrderCard 
                              key={order.id} 
                              order={order} 
                              onExpandStack={(group) => {
                                setGroupingMode('product')
                                setExpandedGroup(group)
                              }}
                            />
                          ))}
                        </div>
                      </section>

                      <Separator className="bg-slate-200/60" />

                      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="space-y-3 xl:col-span-2">
                          <div className="flex items-center justify-between flex-wrap gap-2 px-2">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Artists</h2>
                          </div>
                          <ArtistList artists={data.artists} />
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight px-2">Authentication</h2>
                          <AuthenticationQueue items={pendingAuth} />
                        </div>
                      </section>

                      <section className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 px-2">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">Series binder</h2>
                        </div>
                        <SeriesBinder series={data.series} />
                      </section>

                      <Separator className="bg-slate-200/60" />

                      <section className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 px-2">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">Credits & subscriptions</h2>
                        </div>
                        <CreditsPanel collectorIdentifier={data.collectorIdentifier} />
                      </section>
                    </div>
                  ),
                  collection: (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Collection</h2>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={groupingMode === 'product' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setGroupingMode('product')}
                            className="rounded-full text-xs"
                          >
                            By Product
                          </Button>
                          <Button
                            variant={groupingMode === 'artist' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setGroupingMode('artist')}
                            className="rounded-full text-xs"
                          >
                            By Artist
                          </Button>
                        </div>
                      </div>
                      <PurchasesSection
                        items={lineItems}
                        purchasesByArtist={data.purchasesByArtist}
                        purchasesBySeries={data.purchasesBySeries}
                        groupingMode={groupingMode}
                        onGroupingModeChange={setGroupingMode}
                      />
                    </div>
                  ),
                  editions: (
                    <EditionsGallery 
                      editions={editions} 
                      onExpandStack={(group, mode) => {
                        setGroupingMode(mode)
                        setExpandedGroup(group)
                      }}
                    />
                  ),
                  artists: (
                    <ArtistsCollection artists={data.artistStats || []} />
                  ),
                  certifications: <CertificationsHub certifications={certifications.length > 0 ? certifications : (data.certifications || [])} />,
                  profile: <ProfileSection />,
                  hiddenContent: (
                    <HiddenContentComponent
                      hiddenContent={hiddenContent || data.hiddenContent || { hiddenSeries: [], bonusContent: [] }}
                    />
                  ),
                }}
              </DashboardTabs>
            </div>
          </div>
        </div>
      </div>

      <PremiumExpandedStackModal 
        isOpen={!!expandedGroup}
        onClose={() => setExpandedGroup(null)}
        group={expandedGroup}
        groupingMode={groupingMode}
      />
    </div>
  )
}

