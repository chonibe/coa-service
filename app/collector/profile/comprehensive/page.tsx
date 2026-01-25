'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'



import { Separator } from "@/components/ui"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from "@/components/ui"
import { useToast } from '@/hooks/use-toast'
import { Eye, ShieldCheck, TrendingUp, Users, Award, ShoppingBag, History, MapPin, Phone, Mail, Calendar, DollarSign, Package, Loader2, Wifi, WifiOff } from 'lucide-react'
import { InkOGatchiWidget } from '@/app/collector/dashboard/components/inkogatchi-widget'
import { InkOGatchi } from '@/app/collector/dashboard/components/ink-o-gatchi'
import { NFCAuthSheet } from '@/components/nfc/nfc-auth-sheet'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
interface ComprehensiveProfile {
  user: {
    id: string
    email: string
    created_at: string
  }
  collectorProfile: any
  statistics: {
    totalEditions: number
    authenticatedEditions: number
    totalOrders: number
    totalSpent: number
    firstPurchaseDate: string | null
    lastPurchaseDate: string | null
    profileChangesCount: number
    warehouseRecords: number
  }
  piiSources: {
    profile: any
    shopify: any
    warehouse: any
  }
  editions: {
    all: any[]
    byArtist: Record<string, any[]>
    authenticated: any[]
    pending: any[]
  }
  orders: any[]
  warehouseData: any[]
  activityHistory: {
    profileChanges: any[]
    editionEvents: any[]
  }
}

export default function ComprehensiveProfilePage() {
  const [profile, setProfile] = useState<ComprehensiveProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEdition, setSelectedEdition] = useState<any>(null)
  const [isNfcSheetOpen, setIsNfcSheetOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchComprehensiveProfile()
  }, [])

  const fetchComprehensiveProfile = async () => {
    try {
      const response = await fetch('/api/collector/profile/comprehensive')
      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load comprehensive profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAuthenticate = (edition: any) => {
    setSelectedEdition(edition)
    setIsNfcSheetOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">Unable to load your collector profile.</p>
          <Button onClick={() => router.push('/collector/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const { statistics, piiSources, editions, orders, warehouseData, activityHistory } = profile

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Collector Profile Overview</h1>
        <p className="text-xl text-gray-600">
          Your complete collecting journey, editions, and activity history
        </p>
      </div>

      <div className="mb-8">
        <InkOGatchiWidget />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Editions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalEditions}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.authenticatedEditions} authenticated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              ${statistics.totalSpent.toFixed(2)} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Changes</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.profileChangesCount}</div>
            <p className="text-xs text-muted-foreground">
              Activity updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouse Records</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.warehouseRecords}</div>
            <p className="text-xs text-muted-foreground">
              Fulfillment data
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="editions">Editions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center overflow-hidden border">
                  {profile.collectorProfile?.avatar_url ? (
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile.collectorProfile.avatar_url} />
                      <AvatarFallback>
                        {profile.collectorProfile?.first_name?.[0] || profile.user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="scale-50">
                      <InkOGatchi stage={statistics.totalEditions >= 20 ? 4 : statistics.totalEditions >= 10 ? 3 : statistics.totalEditions >= 5 ? 2 : 1} size={160} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {profile.collectorProfile?.first_name} {profile.collectorProfile?.last_name}
                  </h2>
                  <p className="text-gray-600">{profile.collectorProfile?.email || profile.user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {new Date(profile.user.created_at).toLocaleDateString()}
                  </p>
                  {profile.collectorProfile?.bio && (
                    <p className="text-sm mt-2">{profile.collectorProfile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collection Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Authentication Rate</span>
                      <span>{statistics.totalEditions > 0 ? Math.round((statistics.authenticatedEditions / statistics.totalEditions) * 100) : 0}%</span>
                    </div>
                    <Progress value={statistics.totalEditions > 0 ? (statistics.authenticatedEditions / statistics.totalEditions) * 100 : 0} />
                  </div>
                  <div className="text-sm text-gray-600">
                    {statistics.authenticatedEditions} of {statistics.totalEditions} editions authenticated
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">First Purchase</span>
                    <span className="text-sm">
                      {statistics.firstPurchaseDate ? new Date(statistics.firstPurchaseDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Latest Purchase</span>
                    <span className="text-sm">
                      {statistics.lastPurchaseDate ? new Date(statistics.lastPurchaseDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Spent</span>
                    <span className="text-sm font-medium">${statistics.totalSpent.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Profile
                    </span>
                    <Badge variant={profile.collectorProfile ? "default" : "secondary"}>
                      {profile.collectorProfile ? "Active" : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Shopify
                    </span>
                    <Badge variant={piiSources.shopify ? "default" : "secondary"}>
                      {piiSources.shopify ? "Linked" : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      Warehouse
                    </span>
                    <Badge variant={piiSources.warehouse ? "default" : "secondary"}>
                      {piiSources.warehouse ? "Available" : "None"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edition Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Edition Collection</CardTitle>
                <CardDescription>Your authenticated and pending editions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                      Authenticated
                    </span>
                    <Badge variant="default">{editions.authenticated.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-yellow-500" />
                      Pending
                    </span>
                    <Badge variant="secondary">{editions.pending.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editions by Artist */}
            <Card>
              <CardHeader>
                <CardTitle>By Artist</CardTitle>
                <CardDescription>Your collection organized by artist</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(editions.byArtist).map(([artist, artistEditions]) => (
                    <div key={artist} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{artist}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{artistEditions.length}</Badge>
                        <span className="text-xs text-gray-500">
                          {artistEditions.filter(e => e.nfc_claimed_at).length} auth
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Editions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Editions</CardTitle>
              <CardDescription>Your most recently acquired editions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editions.all.slice(0, 5).map((edition) => (
                  <div key={edition.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{edition.name}</h4>
                      <p className="text-sm text-gray-600">
                        Edition #{edition.edition_number}
                        {edition.edition_total && ` of ${edition.edition_total}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {edition.products?.vendor_name} • {new Date(edition.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {edition.nfc_claimed_at ? (
                        <Badge className="bg-green-100 text-green-800">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Authenticated
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="default"
                            className="h-8 rounded-full"
                            onClick={() => handleAuthenticate(edition)}
                          >
                            Authenticate
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>All your orders and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Order #{order.order_number}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()} •
                        ${order.total_price?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.order_line_items_v2?.length || 0} items •
                        Status: {order.financial_status || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        order.fulfillment_status === 'fulfilled' ? 'default' :
                        order.fulfillment_status === 'unfulfilled' ? 'secondary' : 'outline'
                      }>
                        {order.fulfillment_status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Identity */}
            {piiSources.profile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile Identity
                  </CardTitle>
                  <CardDescription>Your managed profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm">{piiSources.profile.first_name} {piiSources.profile.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm">{piiSources.profile.email}</p>
                  </div>
                  {piiSources.profile.phone && (
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm">{piiSources.profile.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shopify Identity */}
            {piiSources.shopify && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Shopify Identity
                  </CardTitle>
                  <CardDescription>From your Shopify customer record</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm">{piiSources.shopify.first_name} {piiSources.shopify.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm">{piiSources.shopify.email}</p>
                  </div>
                  {piiSources.shopify.phone && (
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm">{piiSources.shopify.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Warehouse Identity */}
            {piiSources.warehouse && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Warehouse Identity
                  </CardTitle>
                  <CardDescription>From your fulfillment records</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm">{piiSources.warehouse.first_name} {piiSources.warehouse.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm">{piiSources.warehouse.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Shipping Address</label>
                    <p className="text-sm">
                      {piiSources.warehouse.address.address1}<br />
                      {piiSources.warehouse.address.city}, {piiSources.warehouse.address.state} {piiSources.warehouse.address.zip}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tracking</label>
                    <p className="text-sm">{piiSources.warehouse.tracking_number}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Your profile changes and edition events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Profile Changes */}
                {activityHistory.profileChanges.map((change) => (
                  <div key={change.id} className="flex items-start space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <User className="h-4 w-4 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile {change.change_type}</p>
                      <p className="text-xs text-gray-600">
                        {change.changed_fields.join(', ')} • {new Date(change.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Edition Events */}
                {activityHistory.editionEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 border-l-4 border-green-500 bg-green-50 rounded">
                    <Award className="h-4 w-4 text-green-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Edition {event.event_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-600">
                        {event.product_id} • Edition #{event.edition_number} • {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedEdition && (
        <NFCAuthSheet
          isOpen={isNfcSheetOpen}
          onClose={() => setIsNfcSheetOpen(false)}
          item={{
            line_item_id: selectedEdition.line_item_id,
            order_id: selectedEdition.order_id,
            name: selectedEdition.name,
            edition_number: selectedEdition.edition_number
          }}
          onSuccess={() => {
            fetchComprehensiveProfile()
          }}
        />
      )}
    </div>
  )
}


