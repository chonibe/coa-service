"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, History, User, Mail, Phone, Edit, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CollectorProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface ProfileChange {
  id: number
  profile_id: string
  user_id: string
  change_type: 'created' | 'updated' | 'deleted'
  field_name: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
}

interface Edition {
  id: string
  name: string
  edition_number: number
  owner_name: string | null
  owner_email: string | null
  created_at: string
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
  certificate_url: string | null
  certificate_generated_at: string | null
  product_id: string
  orders: {
    order_number: string
    processed_at: string
    financial_status: string
    fulfillment_status: string
  } | null
  products: {
    edition_size: number | null
    img_url: string | null
    vendor_name: string | null
  } | null
}

interface Order {
  id: string
  order_number: string
  order_name: string | null
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string
  customer_email: string
  customer_id: string | null
  raw_shopify_order_data: any
  order_line_items_v2: Array<{
    id: string
    name: string
    edition_number: number | null
    product_id: string
    owner_email: string | null
    owner_id: string | null
  }>
}

export default function AdminCollectorProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<CollectorProfile | null>(null)
  const [history, setHistory] = useState<ProfileChange[]>([])
  const [editions, setEditions] = useState<Edition[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        // Fetch collector profile
        const profileRes = await fetch('/api/collector/profile')
        if (profileRes.status === 401) {
          router.push('/login?admin=true')
          return
        }
        if (!profileRes.ok) {
          const errorData = await profileRes.json()
          throw new Error(errorData.message || 'Failed to fetch profile')
        }
        const profileData = await profileRes.json()
        setProfile(profileData.profile)

        // Fetch profile history
        const historyRes = await fetch('/api/collector/profile/history')
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setHistory(historyData.history)
        }

        // Fetch comprehensive profile data
        const comprehensiveRes = await fetch('/api/collector/profile/comprehensive')
        if (comprehensiveRes.ok) {
          const comprehensiveData = await comprehensiveRes.json()
          setEditions(comprehensiveData.editions || [])
          setOrders(comprehensiveData.orders || [])
        }

      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/collector/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const data = await res.json()
      setProfile(data.profile)

      // Re-fetch history to show the update
      const historyRes = await fetch('/api/collector/profile/history')
      const historyData = await historyRes.json()
      setHistory(historyData.history)

      toast({
        title: 'Profile Updated',
        description: 'Your collector profile has been successfully updated.',
      })
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'An unexpected error occurred during update.')
      toast({
        title: 'Update Failed',
        description: err.message || 'There was an error updating your profile.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading collector profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Link>
          </Button>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Collector Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal collector information and view your edition collection.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="editions">
            Editions
            {editions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {editions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders
            {orders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {orders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your collector profile details. This information is visible to you and used for your collection management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={profile?.first_name || ''}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={profile?.last_name || ''}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled // Email is managed by auth.users
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email is managed through your authentication account
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profile?.phone || ''}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profile?.bio || ''}
                    onChange={handleChange}
                    placeholder="Tell us about yourself and your collecting interests..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    value={profile?.avatar_url || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Editions</CardTitle>
              <CardDescription>
                View and manage your collected editions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editions.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No editions found in your collection.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Editions will appear here once you've made purchases and they are fulfilled.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {editions.map((edition) => (
                    <Card key={edition.id} className="border border-slate-200/80 dark:border-slate-800/80">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{edition.name}</h4>
                            <Badge variant="outline">
                              #{edition.edition_number}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {edition.products?.vendor_name || 'Unknown Artist'}
                          </p>
                          {edition.nfc_claimed_at && (
                            <Badge variant="default" className="text-xs">
                              Authenticated
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(edition.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
              <CardDescription>
                View your purchase history and order status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="border border-slate-200/80 dark:border-slate-800/80">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Order #{order.order_number}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.processed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${order.total_price.toFixed(2)}</p>
                            <Badge variant={order.financial_status === 'paid' ? 'default' : 'secondary'}>
                              {order.financial_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Items: {order.order_line_items_v2.length}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Email: {order.customer_email}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Profile Change History
              </CardTitle>
              <CardDescription>
                View all changes made to your collector profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No profile changes recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {history.map((change) => (
                    <div key={change.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {change.field_name ? `${change.field_name} ${change.change_type}` : change.change_type}
                          </p>
                          {change.old_value && change.new_value && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p><span className="font-medium">From:</span> {change.old_value}</p>
                              <p><span className="font-medium">To:</span> {change.new_value}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(change.changed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

