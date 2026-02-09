'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Container,
  SectionWrapper,
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  StatusBadge,
  Input,
} from '@/components/impact'

/**
 * Shop Account Page
 * 
 * Customer account page with order history and profile management.
 * Integrates with Supabase for order data.
 */

interface Order {
  id: string
  shopifyOrderId: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  totalAmount: number
  currency: string
  lineItems?: Array<{
    id: string
    title: string
    variantTitle?: string
    quantity: number
    price: number
    imageUrl?: string
  }>
  shippingAddress?: {
    name: string
    address1: string
    address2?: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  trackingNumber?: string
  trackingUrl?: string
}

interface CustomerProfile {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

export default function AccountPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Check authentication and fetch data
  useEffect(() => {
    async function checkAuthAndFetchData() {
      try {
        // Check if user is authenticated
        const authResponse = await fetch('/api/shop/account/auth')
        
        if (!authResponse.ok) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        setIsAuthenticated(true)
        const { customer } = await authResponse.json()
        setProfile(customer)

        // Fetch orders
        const ordersResponse = await fetch('/api/shop/account/orders')
        if (ordersResponse.ok) {
          const { orders: orderData } = await ordersResponse.json()
          setOrders(orderData || [])
        }
      } catch (error) {
        console.error('Error fetching account data:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [])

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    setProfileLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch('/api/shop/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          phone: formData.get('phone'),
        }),
      })

      if (response.ok) {
        const { customer } = await response.json()
        setProfile(customer)
        alert('Profile updated successfully')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <SectionWrapper spacing="md" background="muted">
          <Container maxWidth="default">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-white rounded w-1/4" />
              <div className="h-64 bg-white rounded-[24px]" />
              <div className="h-64 bg-white rounded-[24px]" />
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f5f5f5]">
        <SectionWrapper spacing="md" background="muted">
          <Container maxWidth="narrow">
            <Card variant="default" padding="lg" className="text-center">
              <div className="py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h1 className="font-heading text-2xl font-semibold text-[#1a1a1a] mb-2">
                  Sign in to your account
                </h1>
                <p className="text-[#1a1a1a]/60 mb-6">
                  Access your order history and manage your profile.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/collector/login">
                    <Button variant="primary" size="lg">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="outline" size="lg">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <SectionWrapper spacing="md" background="muted">
        <Container maxWidth="default">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                My Account
              </h1>
              {profile?.email && (
                <p className="text-[#1a1a1a]/60 mt-1">{profile.email}</p>
              )}
            </div>
            <Link href="/shop">
              <Button variant="outline" size="sm">
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-white rounded-[12px] w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2.5 text-sm font-medium rounded-[8px] transition-colors ${
                activeTab === 'orders'
                  ? 'bg-[#2c4bce] text-white'
                  : 'text-[#1a1a1a]/70 hover:text-[#1a1a1a]'
              }`}
            >
              Order History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2.5 text-sm font-medium rounded-[8px] transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#2c4bce] text-white'
                  : 'text-[#1a1a1a]/70 hover:text-[#1a1a1a]'
              }`}
            >
              Profile
            </button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card variant="default" padding="lg" className="text-center">
                  <div className="py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeOpacity="0.3">
                        <path d="M5.5 10L3 21H21L18.5 10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 10V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V10" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-2">
                      No orders yet
                    </h2>
                    <p className="text-[#1a1a1a]/60 mb-6">
                      When you make a purchase, your orders will appear here.
                    </p>
                    <Link href="/shop">
                      <Button variant="primary">Start Shopping</Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} variant="default" padding="md">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#1a1a1a]/10">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-heading text-lg font-semibold text-[#1a1a1a]">
                            Order #{order.orderNumber}
                          </h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-[#1a1a1a]/60 mt-1">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1a1a1a]">
                          {formatPrice(order.totalAmount, order.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="py-4 space-y-3">
                      {(order.lineItems || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#f5f5f5] flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1a1a1a] truncate">
                              {item.title}
                            </p>
                            {item.variantTitle && (
                              <p className="text-sm text-[#1a1a1a]/60">
                                {item.variantTitle}
                              </p>
                            )}
                            <p className="text-sm text-[#1a1a1a]/60">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-[#1a1a1a]">
                            {formatPrice(item.price * item.quantity, order.currency)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tracking Info */}
                    {order.trackingNumber && (
                      <div className="pt-4 border-t border-[#1a1a1a]/10">
                        <p className="text-sm text-[#1a1a1a]/60">
                          Tracking: {' '}
                          {order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2c4bce] hover:underline"
                            >
                              {order.trackingNumber}
                            </a>
                          ) : (
                            <span className="font-medium text-[#1a1a1a]">
                              {order.trackingNumber}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="pt-4 border-t border-[#1a1a1a]/10">
                        <p className="text-sm font-medium text-[#1a1a1a] mb-1">
                          Shipping Address
                        </p>
                        <p className="text-sm text-[#1a1a1a]/70">
                          {order.shippingAddress.name}<br />
                          {order.shippingAddress.address1}
                          {order.shippingAddress.address2 && <>, {order.shippingAddress.address2}</>}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}<br />
                          {order.shippingAddress.country}
                        </p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <Card variant="default" padding="lg">
              <CardHeader title="Profile Information" />
              <CardContent className="mt-6">
                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-md">
                  <Input
                    label="Email"
                    type="email"
                    value={profile.email}
                    disabled
                    hint="Email cannot be changed"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      name="firstName"
                      defaultValue={profile.firstName || ''}
                      placeholder="Enter first name"
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      defaultValue={profile.lastName || ''}
                      placeholder="Enter last name"
                    />
                  </div>

                  <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone || ''}
                    placeholder="Enter phone number"
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={profileLoading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <Link href="/collector/dashboard" className="block">
              <Card variant="interactive" padding="md" className="h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2c4bce]/10 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c4bce" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1a1a1a]">
                      My Collection
                    </h3>
                    <p className="text-sm text-[#1a1a1a]/60">
                      View your artworks
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/shop" className="block">
              <Card variant="interactive" padding="md" className="h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f0c417]/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b27300" strokeWidth="2">
                      <path d="M5.5 10L3 21H21L18.5 10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 10V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1a1a1a]">
                      Shop
                    </h3>
                    <p className="text-sm text-[#1a1a1a]/60">
                      Browse artworks
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <a href="mailto:support@thestreetcollector.com" className="block">
              <Card variant="interactive" padding="md" className="h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#00a341]/10 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00a341" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-[#1a1a1a]">
                      Support
                    </h3>
                    <p className="text-sm text-[#1a1a1a]/60">
                      Get help
                    </p>
                  </div>
                </div>
              </Card>
            </a>
          </div>
        </Container>
      </SectionWrapper>
    </main>
  )
}
