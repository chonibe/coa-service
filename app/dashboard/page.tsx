"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

import { Separator } from "@/components/ui"

import { formatCurrency, formatDate } from '@/lib/utils'

import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui"
interface DashboardData {
  orderId: string
  orderNumber: number
  processedAt: string
  totalPrice: number
  lineItems: LineItem[]
}

interface LineItem {
  id: string
  productId: string
  name: string
  description: string
  price: number
  quantity: number
  certificateUrl?: string
  nfcTags: NfcTag[]
}

interface NfcTag {
  id: string
  tagId: string
  claimedAt: string | null
  status: string
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/customer/dashboard')
        const result = await response.json()

        if (result.success) {
          setDashboardData(result.dashboard)
        } else {
          setError(result.message || 'Failed to load dashboard')
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const renderNfcTagStatus = (tag: NfcTag) => {
    const statusColors = {
      'claimed': 'bg-green-500',
      'unclaimed': 'bg-yellow-500',
      'expired': 'bg-red-500'
    }
    
    return (
      <Badge 
        variant="outline" 
        className={`${statusColors[tag.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}
      >
        {tag.status}
      </Badge>
    )
  }

  if (isLoading) return <div>Loading dashboard...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
      
      {dashboardData.map(order => (
        <Card key={order.orderId} className="mb-4">
          <CardHeader>
            <CardTitle>
              Order #{order.orderNumber} 
              <span className="text-sm text-muted-foreground ml-2">
                {formatDate(order.processedAt)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {order.lineItems.map(lineItem => (
                <div key={lineItem.id} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{lineItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(lineItem.price)} × {lineItem.quantity}
                      </p>
                    </div>
                    {lineItem.certificateUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(lineItem.certificateUrl, '_blank')}
                      >
                        View Certificate
                      </Button>
                    )}
                  </div>
                  
                  {lineItem.nfcTags.length > 0 && (
                    <div className="mt-2">
                      <Separator className="my-2" />
                      <h4 className="text-sm font-medium mb-2">NFC Tags</h4>
                      <div className="flex gap-2">
                        {lineItem.nfcTags.map(tag => (
                          <div key={tag.id} className="flex items-center gap-2">
                            {renderNfcTagStatus(tag)}
                            {tag.claimedAt && (
                              <span className="text-xs text-muted-foreground">
                                Claimed: {formatDate(tag.claimedAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-right font-bold">
              Total: {formatCurrency(order.totalPrice)}
            </div>
          </CardContent>
        </Card>
      ))}

      {dashboardData.length === 0 && (
        <div className="text-center text-muted-foreground">
          No orders found. Start collecting unique digital art!
        </div>
      )}
    </div>
  )
} 