'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import {
  Container,
  SectionWrapper,
  Button,
  Card,
  CardHeader,
  CardContent,
  StatusBadge,
  Input,
} from '@/components/impact'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui'
import { TrackingTimeline, type TrackingData } from '@/app/admin/warehouse/orders/components/TrackingTimeline'
import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'
import { cn } from '@/lib/utils'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'
import { AddressModal } from '@/components/shop/checkout'
import type { CheckoutAddress } from '@/lib/shop/CheckoutContext'

/**
 * Shop Account Page
 * 
 * Customer account page with order history and profile management.
 * Integrates with Supabase for order data.
 */

/** Interactive shop experience (/shop redirects to street-collector marketing). */
const SHOP_EXPERIENCE_HREF = '/shop/experience'

/** Customer support inbox (matches login/help copy). */
const SHOP_SUPPORT_EMAIL = 'support@thestreetcollector.com'

interface Order {
  id: string
  shopifyOrderId: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'out_for_delivery' | 'cancelled' | 'refunded'
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
  billingAddress?: {
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
  /** Human-readable warehouse status (e.g. "In Transit", "Out for Delivery") when available */
  warehouseStatusLabel?: string
}

type WarehouseDetailPayload = {
  success: true
  chinaDivisionOrder: ChinaDivisionOrderInfo | null
  tracking: TrackingData | null
  warehouseRow: { id: string; order_id: string; tracking_number?: string | null } | null
}

type ShipmentAccordionState =
  | { kind: 'loading' }
  | { kind: 'done'; data: WarehouseDetailPayload }
  | { kind: 'error'; message: string }

function OrderShipmentAccordion({
  orderId,
  orderNumberLabel,
}: {
  orderId: string
  /** Shown in pre-filled support email subject (e.g. Shopify order #). */
  orderNumberLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ShipmentAccordionState | null>(null)
  const [supportEmailOpen, setSupportEmailOpen] = useState(false)
  const loadedSuccessfullyRef = useRef(false)

  const supportSubject = encodeURIComponent(
    `Shipment / delivery question${orderNumberLabel ? ` (Order ${orderNumberLabel})` : ''}`,
  )
  const supportBody = encodeURIComponent(
    `Please include your order number and what you need help with.\n\nOrder: ${orderNumberLabel ?? '(your order #)'}\n`,
  )
  const supportMailtoHref = `mailto:${SHOP_SUPPORT_EMAIL}?subject=${supportSubject}&body=${supportBody}`

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const res = await fetch(
        `/api/shop/account/orders/${encodeURIComponent(orderId)}/warehouse-detail`,
        { credentials: 'include' },
      )
      const data = (await res.json()) as WarehouseDetailPayload & { message?: string }
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || 'Failed to load shipment details')
      }
      loadedSuccessfullyRef.current = true
      setState({ kind: 'done', data: data as WarehouseDetailPayload })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Failed to load shipment details',
      })
    }
  }, [orderId])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && !loadedSuccessfullyRef.current) {
      void load()
    }
  }

  const platformOrderIdForTimeline =
    state?.kind === 'done'
      ? state.data.chinaDivisionOrder?.sys_order_id ||
        state.data.chinaDivisionOrder?.order_id ||
        state.data.warehouseRow?.id ||
        state.data.warehouseRow?.order_id ||
        orderId
      : orderId

  const trackingNumberForTimeline =
    state?.kind === 'done'
      ? state.data.tracking?.tracking_number ||
        state.data.chinaDivisionOrder?.tracking_number ||
        state.data.warehouseRow?.tracking_number ||
        undefined
      : undefined

  const mergedCarrier =
    state?.kind === 'done'
      ? state.data.tracking?.carrier || state.data.chinaDivisionOrder?.carrier
      : undefined

  const mergedLastMile =
    state?.kind === 'done'
      ? state.data.tracking?.last_mile_tracking || state.data.chinaDivisionOrder?.last_mile_tracking
      : undefined

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} className="pt-4 border-t border-[#1a1a1a]/10">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left py-2 rounded-lg hover:bg-black/[0.03] px-2 -mx-2 transition-colors">
        <span className="text-sm font-semibold text-[#1a1a1a]">Shipment &amp; tracking</span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-[#1a1a1a]/50 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-4">
        {!state || state.kind === 'loading' ? (
          <div className="space-y-2 animate-pulse py-2">
            <div className="h-4 bg-[#f5f5f5] rounded w-3/4" />
            <div className="h-4 bg-[#f5f5f5] rounded w-1/2" />
            <div className="h-24 bg-[#f5f5f5] rounded-[12px]" />
          </div>
        ) : state.kind === 'error' ? (
          <div className="rounded-[12px] border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900">
            <p>{state.message}</p>
            <Button variant="outline" size="sm" className="mt-3" type="button" onClick={() => {
              loadedSuccessfullyRef.current = false
              void load()
            }}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {!state.data.chinaDivisionOrder && !state.data.tracking ? (
              <p className="text-sm text-[#1a1a1a]/60 py-2">
                No warehouse shipment data yet for this order. When your package ships, status and tracking events will
                appear here.
              </p>
            ) : null}

            {state.data.chinaDivisionOrder &&
            !state.data.tracking &&
            (state.data.chinaDivisionOrder.track_status_name || state.data.chinaDivisionOrder.status_name) ? (
              <p className="text-sm text-[#1a1a1a]/80 py-1">
                <span className="font-medium text-[#1a1a1a]">Warehouse status: </span>
                {state.data.chinaDivisionOrder.track_status_name || state.data.chinaDivisionOrder.status_name}
              </p>
            ) : null}

            <div className="[&_.rounded-lg]:rounded-[12px]">
              <TrackingTimeline
                compact
                compactJourneyExpandable
                compactJourneyPreviewCount={10}
                compactJourneyLoadMoreStep={25}
                orderId={platformOrderIdForTimeline}
                trackingNumber={trackingNumberForTimeline}
                carrier={mergedCarrier}
                lastMileTracking={mergedLastMile}
                staticTracking={state.data.tracking}
                onRefetch={() => {
                  loadedSuccessfullyRef.current = false
                  void load()
                }}
              />
            </div>

            <div className="rounded-[12px] border border-[#1a1a1a]/10 bg-[#fafafa] px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full sm:w-auto"
                aria-expanded={supportEmailOpen}
                onClick={() => setSupportEmailOpen((v) => !v)}
              >
                {supportEmailOpen ? 'Hide support contact' : 'Need help with this shipment?'}
              </Button>
              {supportEmailOpen ? (
                <div className="mt-3 space-y-3 text-sm text-[#1a1a1a]/80 leading-relaxed">
                  <p>
                    Email is the best way to get a fast answer if anything about your parcel is uncertain or delivery is
                    difficult—we can look up your order and coordinate with our warehouse and carriers.
                  </p>
                  <p className="font-medium text-[#1a1a1a]">
                    <a
                      href={supportMailtoHref}
                      className="text-[#047AFF] hover:underline break-all"
                    >
                      {SHOP_SUPPORT_EMAIL}
                    </a>
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function AccountPage() {
  const { user, isAuthenticated, loading, refreshUser } = useShopAuthContext()
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersHasMore, setOrdersHasMore] = useState(false)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<{
    addresses: Array<{ id: string; address: CheckoutAddress; label: string | null }>
  } | null>(null)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressesLoading, setAddressesLoading] = useState(false)

  const profile = user
    ? { email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }
    : null

  const PAGE_SIZE = 50

  const fetchOrders = useCallback(
    async (offset = 0, append = false) => {
      if (!isAuthenticated) return
      if (offset === 0) setOrdersLoading(true)
      else setLoadMoreLoading(true)
      try {
        const res = await fetch(
          `/api/shop/account/orders?limit=${PAGE_SIZE}&offset=${offset}`
        )
        const data = res.ok ? await res.json() : { orders: [], hasMore: false }
        const list = data.orders || []
        setOrders((prev) => (append ? [...prev, ...list] : list))
        setOrdersHasMore(!!data.hasMore)
      } catch {
        if (!append) setOrders([])
        setOrdersHasMore(false)
      } finally {
        setOrdersLoading(false)
        setLoadMoreLoading(false)
      }
    },
    [isAuthenticated]
  )

  useEffect(() => {
    if (!isAuthenticated) return
    fetchOrders(0, false)
  }, [isAuthenticated, fetchOrders])

  // Fetch saved addresses when authenticated (profile tab / account)
  const fetchAddresses = useCallback(() => {
    if (!isAuthenticated) return
    fetch('/api/shop/account/addresses')
      .then((res) => (res.ok ? res.json() : { addresses: [] }))
      .then((data) => setSavedAddresses({ addresses: data.addresses ?? [] }))
      .catch(() => setSavedAddresses(null))
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'profile') {
      fetchAddresses()
    }
  }, [isAuthenticated, activeTab, fetchAddresses])

  /** Convert order address format to CheckoutAddress for use as initial value in AddressModal */
  const orderAddrToCheckout = (
    addr: Order['shippingAddress'],
    email: string
  ): CheckoutAddress | null => {
    if (!addr?.address1 || !addr.city || !addr.postalCode || !addr.country) return null
    return {
      email,
      fullName: addr.name || '',
      country: addr.country,
      addressLine1: addr.address1,
      addressLine2: addr.address2,
      city: addr.city,
      state: addr.province,
      postalCode: addr.postalCode,
      phoneCountryCode: '+1',
      phoneNumber: '',
    }
  }

  const handleAddressSave = async (address: CheckoutAddress) => {
    setAddressesLoading(true)
    try {
      if (editingAddressId) {
        const res = await fetch('/api/shop/account/addresses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingAddressId, address }),
        })
        if (res.ok) {
          setAddressModalOpen(false)
          setEditingAddressId(null)
          fetchAddresses()
        } else {
          alert('Failed to update address')
        }
      } else {
        const res = await fetch('/api/shop/account/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        })
        if (res.ok) {
          setAddressModalOpen(false)
          fetchAddresses()
        } else {
          alert('Failed to save address')
        }
      }
    } catch (e) {
      console.error(e)
      alert('Failed to save address')
    } finally {
      setAddressesLoading(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return
    setAddressesLoading(true)
    try {
      const res = await fetch(`/api/shop/account/addresses?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchAddresses()
      else alert('Failed to delete address')
    } catch (e) {
      console.error(e)
      alert('Failed to delete address')
    } finally {
      setAddressesLoading(false)
    }
  }

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
        await refreshUser()
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
      <>
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
                    <Button variant="primary" size="lg" onClick={() => setAuthOpen(true)}>
                      Sign In
                    </Button>
                    <Link href={SHOP_EXPERIENCE_HREF}>
                      <Button variant="outline" size="lg">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="mt-4 text-xs text-[#1a1a1a]/50">
                      <Link href="/api/dev/mock-login?email=streets@streets.com&redirect=/shop/account" className="text-amber-600 hover:underline">
                        Dev: View as mock user (streets@streets.com)
                      </Link>
                    </p>
                  )}
                </div>
              </Card>
            </Container>
          </SectionWrapper>
        </main>
        <AuthSlideupMenu
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          redirectTo="/shop/account"
        />
      </>
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
            <div className="flex items-center gap-2">
              {user?.isMockUser && (
                <Link
                  href="/api/dev/mock-logout?redirect=/login?redirect=%2Fshop%2Faccount"
                  className="text-xs text-amber-600 hover:underline"
                >
                  Dev: End mock session
                </Link>
              )}
              <Link href={SHOP_EXPERIENCE_HREF}>
                <Button variant="outline" size="sm">
                  Continue Shopping
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch('/api/collector/logout', { method: 'POST', credentials: 'include' })
                    window.location.href = SHOP_EXPERIENCE_HREF
                  } catch {
                    window.location.href = SHOP_EXPERIENCE_HREF
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-white rounded-[12px] w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2.5 text-sm font-medium rounded-[8px] transition-colors ${
                activeTab === 'orders'
                  ? 'bg-[#047AFF] text-white'
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
                  ? 'bg-[#047AFF] text-white'
                  : 'text-[#1a1a1a]/70 hover:text-[#1a1a1a]'
              }`}
            >
              Profile
            </button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {ordersLoading && orders.length === 0 ? (
                <Card variant="default" padding="lg" className="text-center">
                  <div className="py-8 animate-pulse">
                    <div className="h-6 bg-[#f5f5f5] rounded w-1/3 mx-auto mb-4" />
                    <div className="h-4 bg-[#f5f5f5] rounded w-1/2 mx-auto" />
                  </div>
                </Card>
              ) : orders.length === 0 ? (
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
                    <Link href={SHOP_EXPERIENCE_HREF}>
                      <Button variant="primary">Start Shopping</Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <>
                  {orders.map((order) => (
                    <Card key={order.id} variant="default" padding="md">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#1a1a1a]/10">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-heading text-lg font-semibold text-[#1a1a1a]">
                            Order #{order.orderNumber}
                          </h3>
                          <StatusBadge status={order.status} />
                          {order.warehouseStatusLabel &&
                            ['shipped', 'out_for_delivery'].includes(order.status) && (
                            <span className="text-sm text-[#1a1a1a]/60">
                              · {order.warehouseStatusLabel}
                            </span>
                          )}
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

                    <OrderShipmentAccordion orderId={order.id} orderNumberLabel={order.orderNumber} />

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
                              className="text-[#047AFF] hover:underline"
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
                ))}
                {ordersHasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchOrders(orders.length, true)}
                      disabled={loadMoreLoading}
                    >
                      {loadMoreLoading ? 'Loading...' : 'Load more orders'}
                    </Button>
                  </div>
                )}
              </>
            )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <Card variant="default" padding="lg">
                <CardHeader title="Profile Information" />
                <CardContent className="mt-6">
                  <form
                    key={`${profile.email}-${profile.firstName ?? ''}-${profile.lastName ?? ''}-${profile.phone ?? ''}`}
                    onSubmit={handleProfileUpdate}
                    className="space-y-6 max-w-md"
                  >
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

              {/* Addresses Section - multiple saved addresses */}
              <Card variant="default" padding="lg">
                <CardHeader title="Saved Addresses" />
                <CardContent className="mt-6">
                  <p className="text-sm text-[#1a1a1a]/60 mb-4">
                    Add and manage your addresses. They will appear at checkout so you can choose quickly.
                  </p>
                  <div className="space-y-4">
                    {(savedAddresses?.addresses ?? []).map(({ id, address: addr }) => (
                      <div
                        key={id}
                        className="flex items-start justify-between gap-4 rounded-lg border border-[#1a1a1a]/10 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1a1a1a]">{addr.fullName}</p>
                          <p className="text-sm text-[#1a1a1a]/80 mt-0.5">
                            {addr.addressLine1}
                            {addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                            {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAddressId(id)
                              setAddressModalOpen(true)
                            }}
                            disabled={addressesLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(id)}
                            disabled={addressesLoading}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingAddressId(null)
                        setAddressModalOpen(true)
                      }}
                      disabled={addressesLoading}
                    >
                      Add Address
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <AddressModal
                open={addressModalOpen}
                onOpenChange={(open) => {
                  setAddressModalOpen(open)
                  if (!open) setEditingAddressId(null)
                }}
                initialAddress={
                  editingAddressId
                    ? savedAddresses?.addresses.find((a) => a.id === editingAddressId)?.address
                    : undefined
                }
                onSave={handleAddressSave}
                addressType="shipping"
              />
            </div>
          )}

        </Container>
      </SectionWrapper>
    </main>
  )
}
