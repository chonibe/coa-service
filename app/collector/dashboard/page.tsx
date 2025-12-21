"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, Timer, Wallet, Wand2 } from "lucide-react"
import { ArtworkGrid } from "./components/artwork-grid"
import { ArtistList } from "./components/artist-list"
import { SeriesBinder } from "./components/series-binder"
import { AuthenticationQueue } from "./components/authentication-queue"
import { CreditsPanel } from "./components/credits-panel"

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
}

export default function CollectorDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/collector/dashboard", { credentials: "include" })
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.message || "Failed to load collector dashboard")
        }
        const payload = (await res.json()) as ApiResponse
        setData(payload)
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
          <a href="/api/auth/shopify" className="inline-flex">
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">Collector dashboard</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">Your collection binder</h1>
          <Badge variant="outline">Shopify customer</Badge>
          {data.collectorIdentifier && (
            <Badge variant="secondary">ID: {data.collectorIdentifier.slice(0, 12)}…</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          See purchased artworks, artist journeys, authentication status, and manage credits.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <StatCard
          title="Owned artworks"
          value={data.stats.totalArtworksOwned}
          description="All purchased items"
          icon={<Wand2 className="h-4 w-4" />}
        />
        <StatCard
          title="Authenticated"
          value={data.stats.authenticatedCount}
          description="NFC paired"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          title="Pending auth"
          value={data.stats.unauthenticatedCount}
          description="Finish NFC pairing"
          icon={<Timer className="h-4 w-4" />}
        />
        <StatCard
          title="Certificates"
          value={data.stats.certificatesReady}
          description="Ready to view"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          title="Orders"
          value={data.stats.totalOrders}
          description="Recent purchases"
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">Purchased artworks</h2>
            <p className="text-sm text-muted-foreground">Every line item you own.</p>
          </div>
        </div>
        <ArtworkGrid items={lineItems} />
      </section>

      <Separator />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-semibold">Artists</h2>
              <p className="text-sm text-muted-foreground">Jump into an artist journey.</p>
            </div>
          </div>
          <ArtistList artists={data.artists} />
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Authentication</h2>
          <AuthenticationQueue items={pendingAuth} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">Series binder</h2>
            <p className="text-sm text-muted-foreground">See progress for each series you own.</p>
          </div>
        </div>
        <SeriesBinder series={data.series} />
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">Credits & subscriptions</h2>
            <p className="text-sm text-muted-foreground">
              Manage credit balance and recurring plans to buy more art.
            </p>
          </div>
        </div>
        <CreditsPanel collectorIdentifier={data.collectorIdentifier} />
      </section>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

