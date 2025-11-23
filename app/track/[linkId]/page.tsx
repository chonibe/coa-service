'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Package } from 'lucide-react'
import { TrackingTimeline } from '@/app/admin/warehouse/orders/components/TrackingTimeline'
import type { OrderTrackListItem } from '@/lib/chinadivision/client'

interface TrackingPageData {
  tracking: OrderTrackListItem[]
  branding: {
    logo_url: string | null
    primary_color: string
  }
}

export default function TrackOrderPage({ params }: { params: Promise<{ linkId: string }> | { linkId: string } }) {
  const [linkId, setLinkId] = useState<string | null>(null)
  const [data, setData] = useState<TrackingPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle both sync and async params (Next.js 13+ vs 15+)
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = 'then' in params ? await params : params
      setLinkId(resolvedParams.linkId)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!linkId) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/tracking/${linkId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load tracking information')
        }

        setData(result)
      } catch (err: any) {
        console.error('Error fetching tracking data:', err)
        setError(err.message || 'Failed to load tracking information')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrackingData()
  }, [linkId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!data || !data.tracking || data.tracking.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No tracking information available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { tracking, branding } = data

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4"
      style={{
        '--primary-color': branding.primary_color,
      } as React.CSSProperties}
    >
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header with logo */}
        {branding.logo_url && (
          <div className="flex justify-center mb-8">
            <img 
              src={branding.logo_url} 
              alt="Company Logo" 
              className="h-16 w-auto max-w-xs"
            />
          </div>
        )}

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Order Tracking</h1>
          <p className="text-muted-foreground">
            Track your package delivery status
          </p>
        </div>

        {/* Tracking Timelines */}
        <div className="space-y-6">
          {tracking.map((trackingItem, index) => (
            <TrackingTimeline
              key={trackingItem.order_id || index}
              trackingData={trackingItem}
              logoUrl={branding.logo_url}
              primaryColor={branding.primary_color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
