'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ExclamationCircleIcon,
  CubeIcon,
  TruckIcon,
  MapPinIcon,
  BookmarkIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BellIcon,
  ViewColumnsIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { Icon } from '@/components/icon'
import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'
import { TrackingTimeline } from '../../admin/warehouse/orders/components/TrackingTimeline'
import { ThemeToggle } from '@/components/theme-toggle'

export default function TrackOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  
  const [title, setTitle] = useState<string>('')
  const [orders, setOrders] = useState<ChinaDivisionOrderInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ChinaDivisionOrderInfo | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recipient', 'tracking']))
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [copied, setCopied] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState<string>('#8217ff')
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'alerts'>('alerts')
  const [sortBy, setSortBy] = useState<'default' | 'name'>('default')
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(new Set())
  const [arrivedInCountryOrders, setArrivedInCountryOrders] = useState<Set<string>>(new Set())
  const [pinnedOrderIds, setPinnedOrderIds] = useState<Set<string>>(new Set())
  const [orderLabels, setOrderLabels] = useState<Record<string, string[]>>({})
  const [allCreatedLabels, setAllCreatedLabels] = useState<string[]>([])
  const [labelOrder, setLabelOrder] = useState<string[]>([])
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [labelFilter, setLabelFilter] = useState<string>('all')
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({})
  const [expandedListCards, setExpandedListCards] = useState<Set<string>>(new Set())
  // Email notifications are always enabled
  const emailNotificationsEnabled = true
  const [notificationEmail, setNotificationEmail] = useState<string>('')
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [settingsTab, setSettingsTab] = useState<string>('notifications')
  const [newLabelName, setNewLabelName] = useState<string>('')
  const [selectedLabelForOrders, setSelectedLabelForOrders] = useState<string>('')
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false)
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false)
  const [testEmailSent, setTestEmailSent] = useState<boolean>(false)
  const [previousOrderStatuses, setPreviousOrderStatuses] = useState<Record<string, { status?: number; track_status?: number }>>({})
  const [orderLastUpdateTime, setOrderLastUpdateTime] = useState<Record<string, number>>({})
  const [labelEmails, setLabelEmails] = useState<Record<string, string[]>>({})
  const [labelEmailDrafts, setLabelEmailDrafts] = useState<Record<string, string>>({})
  const [newEmailForLabel, setNewEmailForLabel] = useState<Record<string, string>>({})
  const [alertsSortBy, setAlertsSortBy] = useState<'default' | 'name' | 'updated'>('updated')
  const [alertsFilter, setAlertsFilter] = useState<string>('all')

  // Fetch labels from database
  const fetchLabels = async () => {
    if (!token) return
    try {
      const response = await fetch(`/api/track/${token}/labels`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Load from database
          setAllCreatedLabels(data.data.allCreatedLabels || [])
          setOrderLabels(data.data.orderLabels || {})
          setLabelEmails(data.data.labelEmails || {})
          setLabelOrder(data.data.labelOrder || [])
          
          // Also save to localStorage as cache
          if (data.data.allCreatedLabels) {
            localStorage.setItem(`tracking-created-labels-${token}`, JSON.stringify(data.data.allCreatedLabels))
          }
          if (data.data.orderLabels) {
            localStorage.setItem(`tracking-labels-${token}`, JSON.stringify(data.data.orderLabels))
          }
          if (data.data.labelEmails) {
            localStorage.setItem(`tracking-label-emails-${token}`, JSON.stringify(data.data.labelEmails))
          }
          if (data.data.labelOrder) {
            localStorage.setItem(`tracking-label-order-${token}`, JSON.stringify(data.data.labelOrder))
          }
        }
      } else {
        // If database fetch fails, fallback to localStorage
        console.warn('Failed to fetch labels from database, using localStorage fallback')
        const savedLabels = localStorage.getItem(`tracking-labels-${token}`)
        if (savedLabels) {
          try {
            setOrderLabels(JSON.parse(savedLabels))
          } catch (e) {
            console.error('Error loading labels from localStorage:', e)
          }
        }
        const savedCreatedLabels = localStorage.getItem(`tracking-created-labels-${token}`)
        if (savedCreatedLabels) {
          try {
            setAllCreatedLabels(JSON.parse(savedCreatedLabels))
          } catch (e) {
            console.error('Error loading created labels from localStorage:', e)
          }
        }
        const savedLabelEmails = localStorage.getItem(`tracking-label-emails-${token}`)
        if (savedLabelEmails) {
          try {
            const parsed = JSON.parse(savedLabelEmails)
            const converted: Record<string, string[]> = {}
            Object.keys(parsed).forEach(label => {
              if (Array.isArray(parsed[label])) {
                converted[label] = parsed[label]
              } else if (typeof parsed[label] === 'string' && parsed[label]) {
                converted[label] = [parsed[label]]
              }
            })
            setLabelEmails(converted)
          } catch (e) {
            console.error('Error loading label emails from localStorage:', e)
          }
        }
        const savedLabelOrder = localStorage.getItem(`tracking-label-order-${token}`)
        if (savedLabelOrder) {
          try {
            setLabelOrder(JSON.parse(savedLabelOrder))
          } catch (e) {
            console.error('Error loading label order from localStorage:', e)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching labels:', err)
      // Fallback to localStorage on error
      const savedLabels = localStorage.getItem(`tracking-labels-${token}`)
      if (savedLabels) {
        try {
          setOrderLabels(JSON.parse(savedLabels))
        } catch (e) {
          console.error('Error loading labels from localStorage:', e)
        }
      }
      const savedCreatedLabels = localStorage.getItem(`tracking-created-labels-${token}`)
      if (savedCreatedLabels) {
        try {
          setAllCreatedLabels(JSON.parse(savedCreatedLabels))
        } catch (e) {
          console.error('Error loading created labels from localStorage:', e)
        }
      }
      const savedLabelOrder = localStorage.getItem(`tracking-label-order-${token}`)
      if (savedLabelOrder) {
        try {
          setLabelOrder(JSON.parse(savedLabelOrder))
        } catch (e) {
          console.error('Error loading label order from localStorage:', e)
        }
      }
    }
  }

  // Save labels to database (debounced)
  const saveLabelsToDatabase = useCallback(async () => {
    if (!token) return
    
    // Calculate current label order on the fly to avoid dependency issues
    const labelsSet = new Set<string>()
    allCreatedLabels.forEach(label => labelsSet.add(label))
    Object.values(orderLabels).forEach(labels => {
      labels.forEach(label => labelsSet.add(label))
    })
    const allLabels = Array.from(labelsSet)
    
    let currentLabelOrder: string[]
    if (labelOrder.length > 0) {
      const orderedLabels = labelOrder.filter(label => allLabels.includes(label))
      const unorderedLabels = allLabels.filter(label => !labelOrder.includes(label)).sort()
      currentLabelOrder = [...orderedLabels, ...unorderedLabels]
    } else {
      currentLabelOrder = allLabels.sort()
    }
    
    try {
      const response = await fetch(`/api/track/${token}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allCreatedLabels,
          orderLabels,
          labelEmails,
          labelOrder: currentLabelOrder, // Save current order
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save labels to database:', errorData.message || response.statusText)
      } else {
        console.log('Labels saved to database successfully')
      }
    } catch (err) {
      console.error('Error saving labels to database:', err)
    }
  }, [token, allCreatedLabels, orderLabels, labelEmails, labelOrder])

  useEffect(() => {
    if (token) {
      fetchOrders()
      fetchNotificationPreferences()
      fetchLabels() // Load labels from database
      // Load pinned orders from localStorage
      const saved = localStorage.getItem(`tracking-pinned-${token}`)
      if (saved) {
        try {
          setPinnedOrderIds(new Set(JSON.parse(saved)))
        } catch (e) {
          console.error('Error loading pinned orders:', e)
        }
      }
    }
  }, [token])

  const fetchNotificationPreferences = async () => {
    if (!token) return
    try {
      const response = await fetch(`/api/track/${token}/notifications`)
      if (response.ok) {
        const data = await response.json()
        // Email notifications are always enabled, no need to set from preferences
        setNotificationEmail(data.notificationEmail || '')
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err)
    }
  }

  const saveNotificationPreferences = async () => {
    if (!token) return
    setIsSavingSettings(true)
    try {
      const response = await fetch(`/api/track/${token}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailEnabled: true, // Always enabled
          notificationEmail: notificationEmail,
        }),
      })
      if (response.ok) {
        setIsSettingsOpen(false)
        setTestEmailSent(false) // Reset test email status when saving
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to save notification preferences')
      }
    } catch (err: any) {
      console.error('Error saving notification preferences:', err)
      setError(err.message || 'Failed to save notification preferences')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const sendTestEmail = async () => {
    if (!token || !notificationEmail) return
    setIsTestingEmail(true)
    setTestEmailSent(false)
    setError(null)
    try {
      const response = await fetch(`/api/track/${token}/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notificationEmail,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setTestEmailSent(true)
        setTimeout(() => setTestEmailSent(false), 8000) // Show longer so user can read the note
      } else {
        // Show user-friendly error message
        if (data.errorCode === 'EMAIL_SERVICE_NOT_CONFIGURED') {
          setError('Email service is not configured. Please contact support to enable email notifications.')
        } else if (data.message?.includes('domain') || data.message?.includes('verified')) {
          setError('Email domain not verified. Please verify your domain in Resend dashboard or contact support.')
        } else {
          setError(data.message || 'Failed to send test email')
        }
      }
    } catch (err: any) {
      console.error('Error sending test email:', err)
      setError(err.message || 'Failed to send test email. Please check your connection and try again.')
    } finally {
      setIsTestingEmail(false)
    }
  }

  // Save pinned orders to localStorage
  useEffect(() => {
    if (token && pinnedOrderIds.size > 0) {
      localStorage.setItem(`tracking-pinned-${token}`, JSON.stringify(Array.from(pinnedOrderIds)))
    } else if (token) {
      localStorage.removeItem(`tracking-pinned-${token}`)
    }
  }, [pinnedOrderIds, token])

  const handlePinOrder = (orderId: string) => {
    setPinnedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const isOrderPinned = (order: ChinaDivisionOrderInfo) => {
    const orderKey = order.sys_order_id || order.order_id || ''
    return pinnedOrderIds.has(orderKey)
  }

  // Save labels to localStorage and database when they change (debounced)
  useEffect(() => {
    if (token) {
      localStorage.setItem(`tracking-labels-${token}`, JSON.stringify(orderLabels))
      // Debounce database save
      const timeoutId = setTimeout(() => {
        saveLabelsToDatabase()
      }, 1000) // Wait 1 second after last change
      return () => clearTimeout(timeoutId)
    }
  }, [orderLabels, token, saveLabelsToDatabase])

  // Save created labels to localStorage and database when they change
  useEffect(() => {
    if (token) {
      localStorage.setItem(`tracking-created-labels-${token}`, JSON.stringify(allCreatedLabels))
      // Debounce database save
      const timeoutId = setTimeout(() => {
        saveLabelsToDatabase()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [allCreatedLabels, token, saveLabelsToDatabase])

  // Save label emails to localStorage and database when they change
  useEffect(() => {
    if (token) {
      localStorage.setItem(`tracking-label-emails-${token}`, JSON.stringify(labelEmails))
      // Debounce database save
      const timeoutId = setTimeout(() => {
        saveLabelsToDatabase()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [labelEmails, token, saveLabelsToDatabase])

  // Save label order to localStorage and database when it changes
  useEffect(() => {
    if (token && labelOrder.length > 0) {
      localStorage.setItem(`tracking-label-order-${token}`, JSON.stringify(labelOrder))
      // Debounce database save
      const timeoutId = setTimeout(() => {
        saveLabelsToDatabase()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [labelOrder, token, saveLabelsToDatabase])


  const getOrderKey = (order: ChinaDivisionOrderInfo) => order.sys_order_id || order.order_id || ''

  const getOrderLabels = (order: ChinaDivisionOrderInfo) => orderLabels[getOrderKey(order)] || []
  
  const getLabelEmails = (label: string) => labelEmails[label] || []
  
  const addLabelEmail = (label: string, email: string) => {
    if (email.trim()) {
      setLabelEmails(prev => {
        const current = prev[label] || []
        if (current.includes(email.trim())) return prev
        return { ...prev, [label]: [...current, email.trim()] }
      })
    }
  }
  
  const removeLabelEmail = (label: string, email: string) => {
    setLabelEmails(prev => {
      const current = prev[label] || []
      const filtered = current.filter(e => e !== email)
      if (filtered.length === 0) {
        const next = { ...prev }
        delete next[label]
        return next
      }
      return { ...prev, [label]: filtered }
    })
  }
  
  const sendTestEmailForLabel = async (label: string, email: string) => {
    if (!token || !email.trim()) return
    
    // Get order IDs that have this label
    const labelOrderIds: string[] = []
    filteredOrders.forEach(order => {
      const orderKey = getOrderKey(order)
      const orderLabels = getOrderLabels(order)
      if (orderLabels.includes(label)) {
        labelOrderIds.push(orderKey)
      }
    })
    
    try {
      const response = await fetch(`/api/track/${token}/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, label, orderIds: labelOrderIds }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send test email')
      }
      
      alert(`Test email sent to ${email} for label "${label}"`)
    } catch (err: any) {
      console.error('Error sending test email:', err)
      alert(`Failed to send test email: ${err.message}`)
    }
  }
  
  // Get all unique labels from all orders, respecting label order
  const getAllLabels = useMemo(() => {
    const labelsSet = new Set<string>()
    // Add all created labels
    allCreatedLabels.forEach(label => labelsSet.add(label))
    // Add labels from orders (in case some were created before we started tracking created labels)
    Object.values(orderLabels).forEach(labels => {
      labels.forEach(label => labelsSet.add(label))
    })
    const allLabels = Array.from(labelsSet)
    
    // If we have a saved order, use it; otherwise sort alphabetically
    if (labelOrder.length > 0) {
      // Use the saved order, but include any new labels that aren't in the order
      const orderedLabels = labelOrder.filter(label => allLabels.includes(label))
      const unorderedLabels = allLabels.filter(label => !labelOrder.includes(label)).sort()
      return [...orderedLabels, ...unorderedLabels]
    }
    return allLabels.sort()
  }, [orderLabels, allCreatedLabels, labelOrder])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCountryFilter('all')
    setStateFilter('all')
    setLabelFilter('all')
    setSortBy('default')
  }

  const handleLabelChange = (orderId: string, value: string) => {
    setLabelDrafts(prev => ({ ...prev, [orderId]: value }))
  }

  const addLabelToOrder = (order: ChinaDivisionOrderInfo) => {
    const orderKey = getOrderKey(order)
    const draftValue = (labelDrafts[orderKey] || '').trim()
    if (!draftValue) return
    setOrderLabels(prev => {
      const existing = prev[orderKey] || []
      if (existing.includes(draftValue)) return prev
      return {
        ...prev,
        [orderKey]: [...existing, draftValue],
      }
    })
    setLabelDrafts(prev => ({ ...prev, [orderKey]: '' }))
  }

  const removeLabelFromOrder = (orderId: string, label: string) => {
    setOrderLabels(prev => {
      const current = prev[orderId] || []
      const next = current.filter(l => l !== label)
      if (next.length === 0) {
        const { [orderId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [orderId]: next }
    })
  }

  const handleLabelKeyDown = (order: ChinaDivisionOrderInfo, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addLabelToOrder(order)
    }
  }

  const toggleListCardExpansion = (orderKey: string) => {
    setExpandedListCards(prev => {
      const next = new Set(prev)
      if (next.has(orderKey)) {
        next.delete(orderKey)
      } else {
        next.add(orderKey)
      }
      return next
    })
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/track/${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders')
      }

      setTitle(data.title || 'Order Tracking')
      setOrders(data.orders || [])
      setLogoUrl(data.logoUrl || null)
      setPrimaryColor(data.primaryColor || '#8217ff')
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (order: ChinaDivisionOrderInfo) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  const handleCopyLink = () => {
    // Use the custom domain from environment variable, fallback to current location
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const url = `${baseUrl}/track/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const getStatusBadge = (status?: number, statusName?: string) => {
    if (!status && !statusName) return null

    const statusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'Approving', variant: 'outline' },
      10: { label: 'Approved', variant: 'default' },
      11: { label: 'Uploaded', variant: 'default' },
      8: { label: 'Picking', variant: 'secondary' },
      9: { label: 'Packing', variant: 'secondary' },
      5: { label: 'Packaged', variant: 'default' },
      2: { label: 'Awaiting Shipping', variant: 'outline' },
      3: { label: 'Shipped', variant: 'default' },
      4: { label: 'Special Event', variant: 'secondary' },
      24: { label: 'Processing', variant: 'secondary' },
      19: { label: 'Reviewing', variant: 'outline' },
      21: { label: 'Processing', variant: 'secondary' },
      23: { label: 'Canceled', variant: 'destructive' },
    }

    const statusInfo = status !== undefined ? statusMap[status] : null
    const label = statusName || statusInfo?.label || `Status ${status}`

    return (
      <Badge variant={statusInfo?.variant || 'outline'} className="text-xs">
        {label}
      </Badge>
    )
  }

  const getTrackStatusBadge = (trackStatus?: number, trackStatusName?: string) => {
    if (!trackStatus && !trackStatusName) return null

    const trackStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      0: { label: 'To be updated', variant: 'outline', icon: ClockIcon },
      101: { label: 'In Transit', variant: 'default', icon: TruckIcon },
      111: { label: 'Pick Up', variant: 'secondary', icon: CubeIcon },
      112: { label: 'Out For Delivery', variant: 'default', icon: TruckIcon },
      121: { label: 'Delivered', variant: 'default', icon: CheckCircleIcon },
      131: { label: 'Alert', variant: 'destructive', icon: ExclamationTriangleIcon },
      132: { label: 'Expired', variant: 'destructive', icon: ExclamationCircleIcon },
    }

    const trackInfo = trackStatus !== undefined ? trackStatusMap[trackStatus] : null
    const label = trackStatusName || trackInfo?.label || `Track ${trackStatus}`
    const StatusIcon = trackInfo?.icon || TruckIcon

    return (
      <Badge variant={trackInfo?.variant || 'outline'} className="ml-2 flex items-center gap-1 text-xs">
        <Icon size="xs"><StatusIcon className="h-3 w-3" /></Icon>
        {label}
      </Badge>
    )
  }

  // Helper function to check if order is delivered
  // Uses the latest status from either track_status (121) or track_status_name ("Delivered")
  const isDelivered = (order: ChinaDivisionOrderInfo): boolean => {
    // Check track_status code first
    if (order.track_status === 121) return true
    
    // Check track_status_name (case-insensitive) for "Delivered"
    if (order.track_status_name?.toLowerCase() === 'delivered') return true
    
    return false
  }

  // Helper function to detect if order has arrived in destination country
  const hasArrivedInCountry = (order: ChinaDivisionOrderInfo): boolean => {
    const orderKey = order.sys_order_id || order.order_id || ''
    if (arrivedInCountryOrders.has(orderKey)) return true
    
    if (order.track_status === 111 || order.track_status === 112) return true
    if (isDelivered(order)) return true
    
    if (order.status === 3 && order.track_status === 101 && order.tracking_number) {
      return false
    }
    
    return false
  }

  const allCountries = useMemo(() => {
    return Array.from(new Set((orders || []).map(order => order.ship_country || 'Unknown')))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [orders])

  const statesForCountry = useMemo(() => {
    const source = countryFilter === 'all'
      ? orders
      : orders.filter(order => (order.ship_country || 'Unknown') === countryFilter)
    return Array.from(new Set(source.map(order => order.ship_state).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  }, [orders, countryFilter])

  const availableLabels = useMemo(() => {
    const labels = new Set<string>()
    Object.values(orderLabels).forEach(list => {
      list?.forEach(label => labels.add(label))
    })
    return Array.from(labels).sort((a, b) => a.localeCompare(b))
  }, [orderLabels])

  useEffect(() => {
    if (stateFilter !== 'all' && !statesForCountry.includes(stateFilter)) {
      setStateFilter('all')
    }
  }, [statesForCountry, stateFilter])

  // Helper function to get order priority for sorting
  const getOrderPriority = (order: ChinaDivisionOrderInfo): number => {
    if (isDelivered(order)) return 1
    if (order.track_status === 112) return 2
    if (hasArrivedInCountry(order)) return 3
    if (order.track_status === 101 || order.track_status === 111) return 4
    if (order.status === 3) return 5
    return 6
  }

  // Sort orders by: 1) Pinned first, 2) Most recent updates, 3) Priority, 4) Date
  // OR by contact name A-Z if sortBy is 'name'
  const sortedOrders = [...orders].sort((a, b) => {
    const aPinned = isOrderPinned(a)
    const bPinned = isOrderPinned(b)
    
    // Pinned orders always come first
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    
    // If sorting by name, sort alphabetically by contact name
    if (sortBy === 'name') {
      const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase()
      const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase()
      if (aName !== bName) {
        return aName.localeCompare(bName)
      }
      // If names are the same, maintain pinned order priority
      return 0
    }
    
    // Default sorting: If both pinned or both not pinned, sort by last update time
    const aKey = getOrderKey(a)
    const bKey = getOrderKey(b)
    const aLastUpdate = orderLastUpdateTime[aKey] || 0
    const bLastUpdate = orderLastUpdateTime[bKey] || 0
    
    // Orders with recent updates come first (within pinned or non-pinned groups)
    if (aLastUpdate !== bLastUpdate) {
      return bLastUpdate - aLastUpdate // Most recent first
    }
    
    // If same update time, sort by priority
    const priorityA = getOrderPriority(a)
    const priorityB = getOrderPriority(b)
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Finally, sort by date added (most recent first)
    const dateA = a.date_added ? new Date(a.date_added).getTime() : 0
    const dateB = b.date_added ? new Date(b.date_added).getTime() : 0
    return dateB - dateA
  })

  // Filter orders by search query and status
  const filteredOrders = sortedOrders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        order.order_id.toLowerCase().includes(query) ||
        order.ship_email?.toLowerCase().includes(query) ||
        order.first_name?.toLowerCase().includes(query) ||
        order.last_name?.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query) ||
        order.last_mile_tracking?.toLowerCase().includes(query) ||
        `${order.first_name} ${order.last_name}`.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    if (statusFilter !== 'all') {
      // All status filters now use delivery status (track_status) instead of warehouse status
      if (statusFilter === 'pending') {
        // Pending = not yet in transit (track_status is 0, undefined, or null)
        const hasTracking = order.track_status !== undefined && order.track_status !== null && order.track_status !== 0
        if (hasTracking) return false
      }
      if (statusFilter === 'packing') {
        // Packing is a warehouse status, so we check warehouse status (order.status === 9)
        if (order.status !== 9) return false
      }
      if (statusFilter === 'shipped') {
        // Shipped = has delivery tracking started (track_status >= 101) but not delivered
        const hasTracking = order.track_status !== undefined && order.track_status !== null && order.track_status >= 101
        if (!hasTracking || isDelivered(order)) return false
      }
      if (statusFilter === 'in_transit' && order.track_status !== 101 && order.track_status !== 112) return false
      if (statusFilter === 'delivered' && !isDelivered(order)) return false
    }

    if (countryFilter !== 'all') {
      if ((order.ship_country || 'Unknown') !== countryFilter) return false
    }

    if (stateFilter !== 'all') {
      if ((order.ship_state || 'Unknown') !== stateFilter) return false
    }

    if (labelFilter !== 'all') {
      if (!getOrderLabels(order).includes(labelFilter)) return false
    }

    return true
  })

  const pinnedOrders = useMemo(() => {
    return sortedOrders.filter(order => isOrderPinned(order))
  }, [sortedOrders, pinnedOrderIds])

  // Group orders by delivery status for summary (using track_status, not warehouse status)
  const statusCounts = {
    total: orders.length,
    pending: orders.filter(o => {
      const hasTracking = o.track_status !== undefined && o.track_status !== null && o.track_status !== 0
      return !hasTracking
    }).length,
    packing: orders.filter(o => o.status === 9).length,
    shipped: orders.filter(o => {
      const hasTracking = o.track_status !== undefined && o.track_status !== null && o.track_status >= 101
      return hasTracking && !isDelivered(o)
    }).length,
    in_transit: orders.filter(o => o.track_status === 101 || o.track_status === 112).length,
    delivered: orders.filter(o => isDelivered(o)).length,
    arrived_in_country: orders.filter(o => hasArrivedInCountry(o)).length,
  }

  // Check for new arrivals and send notifications
  useEffect(() => {
    if (orders.length === 0) return

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    orders.forEach((order) => {
      const orderKey = order.sys_order_id || order.order_id || ''
      if (!orderKey) return

      if (hasArrivedInCountry(order) && !notifiedOrders.has(orderKey)) {
        setNotifiedOrders(prev => new Set(prev).add(orderKey))
        setArrivedInCountryOrders(prev => new Set(prev).add(orderKey))

        if ('Notification' in window && Notification.permission === 'granted') {
          const recipientName = `${order.first_name} ${order.last_name}`
          new Notification('Package Arrived in Country! 🎉', {
            body: `Order ${order.order_id} for ${recipientName} has arrived in ${order.ship_country || 'destination country'}`,
            icon: logoUrl || undefined,
            tag: orderKey,
          })
        }
      }
    })
  }, [orders, notifiedOrders, arrivedInCountryOrders, logoUrl])

  // Check for tracking status changes and send email notifications
  useEffect(() => {
    if (orders.length === 0) {
      // Store current statuses for next comparison
      const currentStatuses: Record<string, { status?: number; track_status?: number }> = {}
      orders.forEach(order => {
        const orderKey = order.sys_order_id || order.order_id || ''
        if (orderKey) {
          currentStatuses[orderKey] = {
            status: order.status,
            track_status: order.track_status,
          }
        }
      })
      setPreviousOrderStatuses(currentStatuses)
      return
    }

    const now = Date.now()
    const currentStatuses: Record<string, { status?: number; track_status?: number }> = {}
    const updateTimes: Record<string, number> = {}
    const changedOrders: ChinaDivisionOrderInfo[] = []

    // Compare current orders with previous statuses
    orders.forEach(order => {
      const orderKey = order.sys_order_id || order.order_id || ''
      if (!orderKey) return

      const previous = previousOrderStatuses[orderKey]
      const current = {
        status: order.status,
        track_status: order.track_status,
      }

      currentStatuses[orderKey] = current

      // Check if status changed
      if (!previous || previous.status !== current.status || previous.track_status !== current.track_status) {
        // Status changed - update the timestamp
        updateTimes[orderKey] = now
        changedOrders.push(order)
      } else {
        // No change - keep existing update time or use current time if none exists
        updateTimes[orderKey] = orderLastUpdateTime[orderKey] || now
      }
    })

    // Update last update times
    setOrderLastUpdateTime(prev => ({ ...prev, ...updateTimes }))

    // Send email notifications for changed orders
    // Group orders by email (label emails take priority, then general notification email)
    if (changedOrders.length > 0 && token) {
      const ordersByEmail: Record<string, typeof changedOrders> = {}
      
      changedOrders.forEach(order => {
        const orderKey = getOrderKey(order)
        const orderLabels = getOrderLabels(order)
        
        // Check if order has labels with emails
        let email: string | null = null
        
        // First, check if any of the order's labels have emails
        for (const label of orderLabels) {
          const labelEmail = labelEmails[label]
          if (labelEmail) {
            email = labelEmail
            break // Use the first label email found
          }
        }
        
        // If no label email, use general notification email
        if (!email && emailNotificationsEnabled && notificationEmail) {
          email = notificationEmail
        }
        
        if (email) {
          if (!ordersByEmail[email]) {
            ordersByEmail[email] = []
          }
          ordersByEmail[email].push(order)
        }
      })
      
      // Send email to each unique email address
      for (const [email, ordersForEmail] of Object.entries(ordersByEmail)) {
        fetch(`/api/track/${token}/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            orders: ordersForEmail.map(order => ({
              orderId: order.order_id,
              sysOrderId: order.sys_order_id,
              recipientName: `${order.first_name} ${order.last_name}`,
              status: order.status,
              statusName: order.status_name,
              trackStatus: order.track_status,
              trackStatusName: order.track_status_name,
              trackingNumber: order.tracking_number,
              shipCountry: order.ship_country,
            })),
          }),
        }).catch(err => {
          console.error(`Error sending email notification to ${email}:`, err)
        })
      }
    }

    // Update previous statuses
    setPreviousOrderStatuses(currentStatuses)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, emailNotificationsEnabled, notificationEmail, labelEmails, token])

  // Generate color palette from base color with better contrast
  const generateColorPalette = (baseColor: string) => {
    const hex = baseColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    const rgbToHex = (r: number, g: number, b: number) => {
      return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('')
    }

    const lighten = (amount: number) => {
      return rgbToHex(
        Math.min(255, r + (255 - r) * amount),
        Math.min(255, g + (255 - g) * amount),
        Math.min(255, b + (255 - b) * amount)
      )
    }

    const darken = (amount: number) => {
      return rgbToHex(
        Math.max(0, r * (1 - amount)),
        Math.max(0, g * (1 - amount)),
        Math.max(0, b * (1 - amount))
      )
    }

    const withAlpha = (alpha: number) => {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    // Calculate luminance for text contrast
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const textOnColor = luminance > 0.5 ? '#000000' : '#ffffff'

    return {
      base: baseColor,
      light: lighten(0.2),
      lighter: lighten(0.4),
      lightest: lighten(0.7),
      dark: darken(0.2),
      darker: darken(0.4),
      darkest: darken(0.6),
      alpha5: withAlpha(0.05),
      alpha10: withAlpha(0.1),
      alpha20: withAlpha(0.2),
      alpha30: withAlpha(0.3),
      alpha50: withAlpha(0.5),
      alpha80: withAlpha(0.8),
      textOnColor,
    }
  }

  // Apply custom color palette as CSS variables
  useEffect(() => {
    if (primaryColor) {
      const palette = generateColorPalette(primaryColor)
      const root = document.documentElement
      root.style.setProperty('--brand-primary', palette.base)
      root.style.setProperty('--brand-primary-light', palette.light)
      root.style.setProperty('--brand-primary-lighter', palette.lighter)
      root.style.setProperty('--brand-primary-dark', palette.dark)
      root.style.setProperty('--brand-primary-alpha-10', palette.alpha10)
      root.style.setProperty('--brand-primary-alpha-20', palette.alpha20)
      root.style.setProperty('--brand-primary-alpha-30', palette.alpha30)
      root.style.setProperty('--brand-text-on-color', palette.textOnColor)
    }
  }, [primaryColor])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 max-w-7xl">
        {/* Header with Logo - Glassmorphism */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl mb-4 sm:mb-6 md:mb-8">
          <CardContent className="pt-4 pb-3 sm:pt-6 sm:pb-4 md:pt-8 md:pb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    className="h-8 w-auto sm:h-10 md:h-12 object-contain flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h1 
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight break-words"
                    style={{ color: primaryColor }}
                  >
                    {title || 'Order Tracking'}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                    Track your orders and delivery status
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <ThemeToggle />
                <Button 
                  type="button"
                  onClick={handleCopyLink} 
                  size="sm"
                  variant="outline"
                >
                  {copied ? (
                    <>
                      <Icon size="sm"><CheckIcon className="h-4 w-4" /></Icon>
                      <span className="hidden xs:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Icon size="sm"><DocumentDuplicateIcon className="h-4 w-4" /></Icon>
                      <span className="hidden xs:inline">Copy Link</span>
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  onClick={fetchOrders} 
                  disabled={isLoading}
                  size="sm"
                  className="flex-1 sm:flex-initial"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      const palette = generateColorPalette(primaryColor)
                      e.currentTarget.style.backgroundColor = palette.dark
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor
                  }}
                >
                  <Icon size="sm"><ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Icon>
                  <span className="hidden xs:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - Glassmorphism */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          {[
            { label: 'Total Orders', count: statusCounts.total, color: primaryColor },
            { label: 'Shipped', count: statusCounts.shipped, color: primaryColor },
            { label: 'In Transit', count: statusCounts.in_transit, color: primaryColor },
            { label: 'Delivered', count: statusCounts.delivered, color: primaryColor },
            { label: 'Pending', count: statusCounts.pending, color: primaryColor },
          ].map((stat, idx) => (
            <Card 
              key={idx}
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all"
            >
              <CardContent className="pt-3 pb-2.5 sm:pt-4 sm:pb-3 md:pt-6 md:pb-4">
                <div 
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1" 
                  style={{ color: stat.color }}
                >
                  {stat.count}
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-tight">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pinned Orders */}
        {pinnedOrders.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg mb-4 sm:mb-6">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg" style={{ color: primaryColor }}>
                  <span className="text-lg sm:text-xl">📌</span>
                  Pinned Orders
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  onClick={() => setPinnedOrderIds(new Set())}
                >
                  Clear All
                </Button>
              </div>
              <CardDescription className="text-[10px] sm:text-xs">Quick access to {pinnedOrders.length} pinned order{pinnedOrders.length === 1 ? '' : 's'}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedOrders.map((order) => {
                  const orderKey = getOrderKey(order)
                  const labels = getOrderLabels(order)
                  return (
                    <Card key={orderKey} className="border cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" onClick={() => handleViewDetails(order)}>
                      <CardHeader className="pb-2 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-xs sm:text-sm font-semibold truncate" style={{ color: primaryColor }}>
                              {order.first_name} {order.last_name}
                            </CardTitle>
                            <CardDescription className="text-[10px] sm:text-xs truncate mt-0.5">
                              {order.order_id}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePinOrder(orderKey)
                            }}
                          >
                            <span className="text-sm">📌</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 pt-0">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                          <span>{order.info?.length || 0} items</span>
                          {getTrackStatusBadge(order.track_status, order.track_status_name)}
                        </div>
                        {labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {labels.map(label => (
                              <Badge key={label} variant="secondary" className="text-[9px] sm:text-[10px] flex items-center gap-0.5 px-1.5 py-0.5">
                                {label}
                                <button
                                  className="text-[9px] sm:text-[10px] ml-0.5 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeLabelFromOrder(orderKey, label)
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters - Glassmorphism */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg mb-4 sm:mb-6 md:mb-8">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
              <CardTitle className="text-sm sm:text-base md:text-lg">Filters</CardTitle>
              {(searchQuery || statusFilter !== 'all' || countryFilter !== 'all' || stateFilter !== 'all' || labelFilter !== 'all' || sortBy !== 'default') && (
                <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <CardDescription className="text-[10px] sm:text-xs">Refine orders by status, destination, and labels</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 sm:pt-4 md:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <MagnifyingGlassIcon 
                  className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" 
                />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-md border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="packing">Packing</option>
                  <option value="shipped">Shipped</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'default' | 'name')}
                  className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-md border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="default">Sort: Default</option>
                  <option value="name">Sort: Contact Name A-Z</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-md border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Countries</option>
                  {allCountries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-md border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                  disabled={statesForCountry.length === 0}
                >
                  <option value="all">All States/Regions</option>
                  {statesForCountry.map(state => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <select
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-md border bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Labels</option>
                  {availableLabels.map(label => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle - Separate Section */}
        <div className="flex items-center justify-end gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="flex border rounded-md overflow-hidden border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-9 sm:h-10 px-3 sm:px-4 rounded-none ${viewMode === 'card' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                onClick={() => setViewMode('card')}
              >
                <Icon size="sm"><Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" /></Icon>
                <span className="ml-2 text-xs sm:text-sm hidden sm:inline">Card</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-9 sm:h-10 px-3 sm:px-4 rounded-none ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <Icon size="sm"><ListBulletIcon className="h-4 w-4 sm:h-5 sm:w-5" /></Icon>
                <span className="ml-2 text-xs sm:text-sm hidden sm:inline">List</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-9 sm:h-10 px-3 sm:px-4 rounded-none ${viewMode === 'alerts' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                onClick={() => setViewMode('alerts')}
              >
                <Icon size="sm"><ViewColumnsIcon className="h-4 w-4 sm:h-5 sm:w-5" /></Icon>
                <span className="ml-2 text-xs sm:text-sm hidden sm:inline">Alerts</span>
              </Button>
            </div>
            <Button 
              type="button"
              onClick={() => {
                setIsSettingsOpen(true)
                setSettingsTab('notifications')
              }}
              size="sm"
              variant="outline"
              className="h-9 sm:h-10"
            >
              <Icon size="sm"><BellIcon className="h-4 w-4" /></Icon>
              <span className="hidden xs:inline ml-1">Notifications</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6 md:mb-8">
            <Icon size="sm"><ExclamationCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Icon>
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                  <Skeleton className="h-3 sm:h-4 w-36 sm:w-48 mt-2" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <Skeleton className="h-16 sm:h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg">
            <CardContent className="py-8 sm:py-12 text-center">
              <Icon size="xl"><CubeIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-400 mb-3 sm:mb-4" /></Icon>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'No orders found matching your filters.'
                  : 'No orders found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
            {viewMode === 'alerts' ? (
              <AlertsView
                orders={filteredOrders}
                getAllLabels={getAllLabels}
                labelOrder={labelOrder}
                getOrderLabels={getOrderLabels}
                getOrderKey={getOrderKey}
                primaryColor={primaryColor}
                onViewDetails={handleViewDetails}
                onAddLabelToOrder={(order, label) => {
                  const orderKey = getOrderKey(order)
                  setOrderLabels(prev => {
                    const current = prev[orderKey] || []
                    if (!current.includes(label)) {
                      return { ...prev, [orderKey]: [...current, label] }
                    }
                    return prev
                  })
                }}
                onRemoveLabelFromOrder={(order, label) => {
                  const orderKey = getOrderKey(order)
                  removeLabelFromOrder(orderKey, label)
                }}
                getUnlabeledOrders={() => filteredOrders.filter(order => getOrderLabels(order).length === 0)}
                getOrdersForLabel={(label) => filteredOrders.filter(order => getOrderLabels(order).includes(label))}
                labelEmails={labelEmails}
                labelEmailDrafts={labelEmailDrafts}
                newEmailForLabel={newEmailForLabel}
                setNewEmailForLabel={setNewEmailForLabel}
                addLabelEmail={addLabelEmail}
                removeLabelEmail={removeLabelEmail}
                sendTestEmailForLabel={sendTestEmailForLabel}
                alertsSortBy={alertsSortBy}
                setAlertsSortBy={setAlertsSortBy}
                alertsFilter={alertsFilter}
                setAlertsFilter={setAlertsFilter}
                pinnedOrderIds={pinnedOrderIds}
                orderLastUpdateTime={orderLastUpdateTime}
                newLabelName={newLabelName}
                setNewLabelName={setNewLabelName}
                onAddLabel={() => {
                  if (!newLabelName.trim()) return
                  const labelName = newLabelName.trim()
                  // Add to created labels if not already there
                  setAllCreatedLabels(prev => {
                    if (prev.includes(labelName)) return prev
                    return [...prev, labelName].sort()
                  })
                  setNewLabelName('')
                }}
                onRemoveLabel={(label) => {
                  // Remove from all created labels
                  setAllCreatedLabels(prev => prev.filter(l => l !== label))
                  // Remove from all orders
                  setOrderLabels(prev => {
                    const next = { ...prev }
                    Object.keys(next).forEach(orderKey => {
                      next[orderKey] = next[orderKey].filter(l => l !== label)
                      if (next[orderKey].length === 0) {
                        delete next[orderKey]
                      }
                    })
                    return next
                  })
                  setLabelEmails(prev => {
                    const next = { ...prev }
                    delete next[label]
                    return next
                  })
                }}
                onReorderLabels={(newOrder) => {
                  setLabelOrder(newOrder)
                }}
                getStatusBadge={getStatusBadge}
                getTrackStatusBadge={getTrackStatusBadge}
              />
            ) : viewMode === 'card' ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => {
                  const itemCount = order.info?.length || 0
                  const recipientName = `${order.first_name} ${order.last_name}`
                  const orderKey = getOrderKey(order)
                  const labels = getOrderLabels(order)

                  return (
                    <Card
                      key={order.order_id}
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group active:scale-[0.98]"
                      onClick={() => handleViewDetails(order)}
                    >
                      <CardContent className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <h3 
                                className="text-sm sm:text-base md:text-lg font-semibold truncate"
                                style={{ color: primaryColor }}
                              >
                                {recipientName}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePinOrder(orderKey)
                                }}
                              >
                                <span className={`text-base ${isOrderPinned(order) ? '' : 'opacity-50'}`}>📌</span>
                              </Button>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              Order {order.order_id} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-wrap items-center justify-end flex-shrink-0">
                            {hasArrivedInCountry(order) && (
                              <Badge className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                                <span className="text-xs mr-0.5">📌</span>
                                Arrived
                              </Badge>
                            )}
                            {getStatusBadge(order.status, order.status_name)}
                            {getTrackStatusBadge(order.track_status, order.track_status_name)}
                          </div>
                        </div>

                        <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {order.ship_email && (
                            <div className="flex items-center gap-1.5">
                              <Icon size="sm"><EnvelopeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 flex-shrink-0" /></Icon>
                              <span className="truncate">{order.ship_email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-400 flex-shrink-0">📍</span>
                            <span className="truncate">{order.ship_city}, {order.ship_state} • {order.ship_country}</span>
                          </div>
                          {order.tracking_number && (
                            <div className="flex items-center gap-1.5">
                              <Icon size="sm"><TruckIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 flex-shrink-0" /></Icon>
                              <span className="font-mono font-medium truncate" style={{ color: primaryColor }}>
                                {order.tracking_number}
                              </span>
                            </div>
                          )}
                        </div>

                        {labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {labels.map(label => (
                              <Badge key={label} variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0.5">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}


                        {order.order_id && (
                          <div>
                            <TrackingTimeline 
                              orderId={order.order_id}
                              trackingNumber={order.tracking_number}
                              compact={true}
                              carrier={order.carrier}
                              lastMileTracking={order.last_mile_tracking}
                            />
                          </div>
                        )}

                        <Button 
                          size="sm" 
                          className="w-full font-medium text-white shadow-md hover:shadow-lg transition-all text-xs sm:text-sm h-9 sm:h-10"
                          style={{
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                          }}
                          onMouseEnter={(e) => {
                            const palette = generateColorPalette(primaryColor)
                            e.currentTarget.style.backgroundColor = palette.dark
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = primaryColor
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(order)
                          }}
                        >
                          <Icon size="sm"><CubeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /></Icon>
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                {filteredOrders.map((order) => {
                  const itemCount = order.info?.length || 0
                  const recipientName = `${order.first_name} ${order.last_name}`
                  const orderKey = getOrderKey(order)
                  const labels = getOrderLabels(order)
                  const isExpanded = expandedListCards.has(orderKey)

                  return (
                    <Card
                      key={order.order_id}
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                    >
                      <CardContent className="p-2.5 sm:p-3 md:p-4">
                        {/* Compact Header - Always Visible */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePinOrder(orderKey)
                            }}
                          >
                            <span className={`text-base ${isOrderPinned(order) ? '' : 'opacity-50'}`}>📌</span>
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: primaryColor }}>
                                {recipientName}
                              </span>
                              {hasArrivedInCountry(order) && (
                                <Badge className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                                  Arrived
                                </Badge>
                              )}
                              {getStatusBadge(order.status, order.status_name)}
                              {getTrackStatusBadge(order.track_status, order.track_status_name)}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-1.5 sm:gap-2 mt-0.5">
                              <span>Order {order.order_id}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleListCardExpansion(orderKey)
                            }}
                          >
                            {isExpanded ? (
                              <Icon size="sm"><ChevronUpIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" /></Icon>
                            ) : (
                              <Icon size="sm"><ChevronDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" /></Icon>
                            )}
                          </Button>
                          <Button 
                            size="sm"
                            className="flex-shrink-0 text-[10px] sm:text-xs text-white shadow-md h-7 sm:h-8 px-2 sm:px-3"
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                            onMouseEnter={(e) => {
                              const palette = generateColorPalette(primaryColor)
                              e.currentTarget.style.backgroundColor = palette.dark
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = primaryColor
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(order)
                            }}
                          >
                            <Icon size="sm"><CubeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /></Icon>
                            <span className="hidden xs:inline">Details</span>
                          </Button>
                        </div>

                        {/* Expandable Content */}
                        {isExpanded && (
                          <div className="mt-2.5 sm:mt-3 space-y-2 pt-2.5 sm:pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
                              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                              {order.tracking_number && (
                                <>
                                  <span className="mx-1.5">•</span>
                                  <span className="font-mono truncate" style={{ color: primaryColor }}>{order.tracking_number}</span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
                              {order.ship_email && (
                                <span className="truncate flex items-center gap-1.5">
                                  <Icon size="sm"><EnvelopeIcon className="h-3 w-3 text-slate-400 flex-shrink-0" /></Icon>
                                  <span className="truncate">{order.ship_email}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <span className="text-sm text-slate-400 flex-shrink-0">📍</span>
                                <span className="truncate">{order.ship_city}, {order.ship_state} • {order.ship_country}</span>
                              </span>
                            </div>

                            {labels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {labels.map(label => (
                                  <Badge key={label} variant="secondary" className="text-[9px] sm:text-[10px] flex items-center gap-0.5 px-1.5 py-0.5">
                                    {label}
                                    <button
                                      className="text-[9px] sm:text-[10px] ml-0.5 hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeLabelFromOrder(orderKey, label)
                                      }}
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}

                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent 
            className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl p-4 sm:p-6"
            style={{ borderTop: `4px solid ${primaryColor}` }}
          >
            <DialogHeader className="pb-3 sm:pb-4">
              <DialogTitle className="text-base sm:text-lg md:text-xl" style={{ color: primaryColor }}>
                Order Details - {selectedOrder?.first_name} {selectedOrder?.last_name}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Complete order information and item details
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <ScrollArea className="max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-120px)] pr-2 sm:pr-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* Order Summary */}
                  <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="p-3 sm:p-4 md:p-6">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                            <Icon size="sm"><EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" /></Icon>
                            {selectedOrder.first_name} {selectedOrder.last_name}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1">
                            Order {selectedOrder.order_id} • {selectedOrder.info?.length || 0} items
                          </CardDescription>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          {getStatusBadge(selectedOrder.status, selectedOrder.status_name)}
                          {getTrackStatusBadge(selectedOrder.track_status, selectedOrder.track_status_name)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
                      {/* Contact & Address Information - Collapsible */}
                      <div>
                        <button
                          onClick={() => toggleSection('recipient')}
                          className="w-full flex items-center justify-between font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                          <span>Contact & Address Details</span>
                          <Icon size="sm">
                            {expandedSections.has('recipient') ? (
                              <ChevronUpIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <ChevronDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Icon>
                        </button>
                        {expandedSections.has('recipient') && (
                          <div className="text-xs sm:text-sm space-y-3 pl-0">
                            {(selectedOrder.ship_email || selectedOrder.ship_phone) && (
                              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                                {selectedOrder.ship_email && (
                                  <p>
                                    <span className="font-medium">Email:</span> {selectedOrder.ship_email}
                                  </p>
                                )}
                                {selectedOrder.ship_phone && (
                                  <p>
                                    <span className="font-medium">Phone:</span> {selectedOrder.ship_phone}
                                  </p>
                                )}
                              </div>
                            )}
                            <div>
                              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                                <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">Address</p>
                                <p>{selectedOrder.ship_address1}</p>
                                {selectedOrder.ship_address2 && <p>{selectedOrder.ship_address2}</p>}
                                <p>
                                  {selectedOrder.ship_city}, {selectedOrder.ship_state} {selectedOrder.ship_zip}
                                </p>
                                <p>{selectedOrder.ship_country}</p>
                              </div>
                            </div>
                            {(selectedOrder.tracking_number || selectedOrder.last_mile_tracking) && (
                              <div>
                                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">Tracking</p>
                                  {selectedOrder.tracking_number && (
                                    <p className="font-mono break-all">{selectedOrder.tracking_number}</p>
                                  )}
                                  {selectedOrder.last_mile_tracking && (
                                    <p className="font-mono break-all">{selectedOrder.last_mile_tracking}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  {selectedOrder.info && selectedOrder.info.length > 0 && (
                    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader className="p-3 sm:p-4 md:p-6">
                        <button
                          onClick={() => toggleSection('items')}
                          className="w-full flex items-center justify-between"
                        >
                          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base" style={{ color: primaryColor }}>
                            <Icon size="sm"><CubeIcon className="h-4 w-4 sm:h-5 sm:w-5" /></Icon>
                            Order Items ({selectedOrder.info.length})
                          </CardTitle>
                          <Icon size="sm">
                            {expandedSections.has('items') ? (
                              <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </Icon>
                        </button>
                      </CardHeader>
                      {expandedSections.has('items') && (
                        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                        <div className="overflow-x-auto -mx-3 sm:mx-0">
                          <div className="min-w-full inline-block align-middle">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                  <TableHead className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">Product</TableHead>
                                  <TableHead className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">SKU</TableHead>
                                  <TableHead className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 hidden sm:table-cell">Details</TableHead>
                                  <TableHead className="text-right text-xs sm:text-sm text-slate-900 dark:text-slate-100">Qty</TableHead>
                                  <TableHead className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedOrder.info.map((item, index) => (
                                  <TableRow key={index} className="border-slate-200/50 dark:border-slate-700/50">
                                    <TableCell className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                                      <p className="font-medium">
                                        {item.product_name || item.sku || 'Unknown Product'}
                                      </p>
                                      {(item.color || item.size) && (
                                        <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                                          {item.color && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                                              {item.color}
                                            </span>
                                          )}
                                          {item.size && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                                              {item.size}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                      <p className="font-mono break-all">
                                        {item.sku || item.sku_code || '-'}
                                      </p>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      <div className="flex flex-wrap gap-1.5 text-xs">
                                        {item.color && (
                                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                                            Color: {item.color}
                                          </span>
                                        )}
                                        {item.size && (
                                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                                            Size: {item.size}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                                      <p className="font-medium">{item.quantity}</p>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1">
                                        {getStatusBadge(selectedOrder.status, selectedOrder.status_name)}
                                        {getTrackStatusBadge(selectedOrder.track_status, selectedOrder.track_status_name)}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                      )}
                    </Card>
                  )}

                  {/* STONE3PL Tracking Timeline */}
                  {selectedOrder.order_id && (
                    <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader className="p-3 sm:p-4 md:p-6 pb-3">
                        <button
                          onClick={() => toggleSection('tracking')}
                          className="w-full flex items-center justify-between"
                        >
                          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base" style={{ color: primaryColor }}>
                            <Icon size="sm"><TruckIcon className="h-4 w-4 sm:h-5 sm:w-5" /></Icon>
                            Tracking Timeline
                          </CardTitle>
                          <Icon size="sm">
                            {expandedSections.has('tracking') ? (
                              <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </Icon>
                        </button>
                      </CardHeader>
                      {expandedSections.has('tracking') && (
                        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                          <TrackingTimeline
                            orderId={selectedOrder.order_id}
                            trackingNumber={selectedOrder.tracking_number}
                            carrier={selectedOrder.carrier}
                            lastMileTracking={selectedOrder.last_mile_tracking}
                          />
                        </CardContent>
                      )}
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent 
            className="max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl"
            style={{ borderTop: `4px solid ${primaryColor}` }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
                <Icon size="sm"><BellIcon className="h-5 w-5" /></Icon>
                Notification Settings
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Receive email notifications when your order tracking status changes
              </DialogDescription>
            </DialogHeader>
            <Tabs value={settingsTab} onValueChange={setSettingsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="labels">Labels</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notifications" className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Icon size="sm"><BellIcon className="h-4 w-4" /></Icon>
                    Email Notifications
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Get notified when order status changes
                  </p>
                </div>

                <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="notification-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="notification-email"
                        type="email"
                        placeholder="your@email.com"
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                        className="h-10"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        We'll send tracking updates to this email address for orders without label emails
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendTestEmail}
                      disabled={isTestingEmail || !notificationEmail || !notificationEmail.includes('@')}
                      className="w-full"
                      title={!notificationEmail || !notificationEmail.includes('@') ? 'Please enter a valid email address' : 'Send a test email to verify notifications work'}
                    >
                      {isTestingEmail ? (
                        <>
                          <Icon size="sm"><ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" /></Icon>
                          Sending Test Email...
                        </>
                      ) : testEmailSent ? (
                        <>
                          <Icon size="sm"><CheckIcon className="h-4 w-4 mr-2" /></Icon>
                          Test Email Sent!
                        </>
                      ) : (
                        <>
                          <Icon size="sm"><PaperAirplaneIcon className="h-4 w-4 mr-2" /></Icon>
                          Send Test Email
                        </>
                      )}
                    </Button>
                    {testEmailSent && (
                      <div className="space-y-1">
                        <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
                          ✓ Test email sent successfully!
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                          Check your inbox. If you don't see it, check your spam folder. It may take a few moments to arrive.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                          Tip: Verify your domain in Resend for better deliverability.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="labels" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Create New Label</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                      Type a label name below and assign it to orders. Labels are created when assigned to orders.
                    </p>
                    <Input
                      type="text"
                      placeholder="Enter label name..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  {/* Create label by assigning to order */}
                  {newLabelName.trim() && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-sm font-medium">Assign "{newLabelName.trim()}" to orders</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select orders to assign this new label to. The label will be created when assigned.
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {orders.map(order => {
                          const orderKey = getOrderKey(order)
                          const hasLabel = getOrderLabels(order).includes(newLabelName.trim())
                          return (
                            <div key={orderKey} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {order.first_name} {order.last_name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Order {order.order_id}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant={hasLabel ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const orderKey = getOrderKey(order)
                                  const labelToAdd = newLabelName.trim()
                                  if (hasLabel) {
                                    removeLabelFromOrder(orderKey, labelToAdd)
                                  } else {
                                    setOrderLabels(prev => {
                                      const current = prev[orderKey] || []
                                      if (!current.includes(labelToAdd)) {
                                        return { ...prev, [orderKey]: [...current, labelToAdd] }
                                      }
                                      return prev
                                    })
                                  }
                                }}
                              >
                                {hasLabel ? 'Remove' : 'Add Label'}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Label Email Management */}
                  {getAllLabels.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Label Email Notifications</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Add emails to specific labels. Orders with those labels will send notifications to the label's email.
                        </p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getAllLabels.map(label => (
                          <div key={label} className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs flex-shrink-0 min-w-[100px] justify-center">
                              {label}
                            </Badge>
                            <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                              Manage label emails in the Alerts view
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manage Orders by Label */}
                  {getAllLabels.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Manage Orders by Label</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Select a label to see and manage which orders have that label
                        </p>
                      </div>
                      <div className="space-y-3">
                        <select
                          value={selectedLabelForOrders}
                          onChange={(e) => setSelectedLabelForOrders(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                        >
                          <option value="">Select a label...</option>
                          {getAllLabels.map(label => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>

                        {selectedLabelForOrders && (
                          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-3 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                Orders with label "{selectedLabelForOrders}"
                              </span>
                              <Badge variant="secondary">
                                {orders.filter(order => getOrderLabels(order).includes(selectedLabelForOrders)).length} orders
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {orders
                                .filter(order => getOrderLabels(order).includes(selectedLabelForOrders))
                                .map(order => {
                                  const orderKey = getOrderKey(order)
                                  return (
                                    <div key={orderKey} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {order.first_name} {order.last_name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          Order {order.order_id}
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLabelFromOrder(orderKey, selectedLabelForOrders)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  )
                                })}
                            </div>
                            <div className="pt-2 border-t">
                              <Label className="text-xs font-medium mb-2 block">Add label to orders</Label>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {orders
                                  .filter(order => !getOrderLabels(order).includes(selectedLabelForOrders))
                                  .map(order => {
                                    const orderKey = getOrderKey(order)
                                    return (
                                      <div key={orderKey} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {order.first_name} {order.last_name}
                                          </p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Order {order.order_id}
                                          </p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const orderKey = getOrderKey(order)
                                            setOrderLabels(prev => {
                                              const current = prev[orderKey] || []
                                              if (!current.includes(selectedLabelForOrders)) {
                                                return { ...prev, [orderKey]: [...current, selectedLabelForOrders] }
                                              }
                                              return prev
                                            })
                                          }}
                                        >
                                          Add Label
                                        </Button>
                                      </div>
                                    )
                                  })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {getAllLabels.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <p className="text-sm">No labels created yet.</p>
                      <p className="text-xs mt-1">Create a label above and assign it to orders.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveNotificationPreferences}
                  disabled={isSavingSettings || !notificationEmail}
                  className="flex-1"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSavingSettings) {
                      const palette = generateColorPalette(primaryColor)
                      e.currentTarget.style.backgroundColor = palette.dark
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor
                  }}
                >
                  {isSavingSettings ? (
                    <>
                      <Icon size="sm"><ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" /></Icon>
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Alerts View Component
function AlertsView({
  orders,
  getAllLabels,
  getOrderLabels,
  getOrderKey,
  primaryColor,
  onViewDetails,
  onAddLabelToOrder,
  onRemoveLabelFromOrder,
  getUnlabeledOrders,
  getOrdersForLabel,
  labelEmails,
  labelEmailDrafts,
  newEmailForLabel,
  setNewEmailForLabel,
  addLabelEmail,
  removeLabelEmail,
  sendTestEmailForLabel,
  alertsSortBy,
  setAlertsSortBy,
  alertsFilter,
  setAlertsFilter,
  pinnedOrderIds,
  orderLastUpdateTime,
  newLabelName,
  setNewLabelName,
  onAddLabel,
  onRemoveLabel,
  onReorderLabels,
  getStatusBadge,
  getTrackStatusBadge,
}: {
  orders: ChinaDivisionOrderInfo[]
  getAllLabels: string[]
  labelOrder: string[]
  getOrderLabels: (order: ChinaDivisionOrderInfo) => string[]
  getOrderKey: (order: ChinaDivisionOrderInfo) => string
  primaryColor: string
  onViewDetails: (order: ChinaDivisionOrderInfo) => void
  onAddLabelToOrder: (order: ChinaDivisionOrderInfo, label: string) => void
  onRemoveLabelFromOrder: (order: ChinaDivisionOrderInfo, label: string) => void
  getUnlabeledOrders: () => ChinaDivisionOrderInfo[]
  getOrdersForLabel: (label: string) => ChinaDivisionOrderInfo[]
  labelEmails: Record<string, string[]>
  labelEmailDrafts: Record<string, string>
  newEmailForLabel: Record<string, string>
  setNewEmailForLabel: React.Dispatch<React.SetStateAction<Record<string, string>>>
  addLabelEmail: (label: string, email: string) => void
  removeLabelEmail: (label: string, email: string) => void
  sendTestEmailForLabel: (label: string, email: string) => Promise<void>
  alertsSortBy: 'default' | 'name' | 'updated'
  setAlertsSortBy: React.Dispatch<React.SetStateAction<'default' | 'name' | 'updated'>>
  alertsFilter: string
  setAlertsFilter: React.Dispatch<React.SetStateAction<string>>
  pinnedOrderIds: Set<string>
  orderLastUpdateTime: Record<string, number>
  newLabelName: string
  setNewLabelName: React.Dispatch<React.SetStateAction<string>>
  onAddLabel: () => void
  onRemoveLabel: (label: string) => void
  onReorderLabels: (newOrder: string[]) => void
  getStatusBadge: (status?: number, statusName?: string) => React.ReactNode
  getTrackStatusBadge: (trackStatus?: number, trackStatusName?: string) => React.ReactNode
}) {
  const getLabelEmails = (label: string) => labelEmails[label] || []
  const [draggedOrder, setDraggedOrder] = useState<{ order: ChinaDivisionOrderInfo; sourceLabel: string | null } | null>(null)
  const [dragOverLabel, setDragOverLabel] = useState<string | null>(null)
  const [isUnlabeledCollapsed, setIsUnlabeledCollapsed] = useState(false)
  const [draggedLabelColumn, setDraggedLabelColumn] = useState<string | null>(null)
  const [dragOverLabelColumn, setDragOverLabelColumn] = useState<string | null>(null)

  // Generate a unique color for each label based on its index
  const getLabelColor = (label: string, index: number) => {
    // Predefined palette of distinct colors
    const colorPalette = [
      '#8217ff', // Purple (primary)
      '#ff4f44', // Red
      '#110034', // Dark purple
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#14b8a6', // Teal
      '#f97316', // Orange
      '#6366f1', // Indigo
      '#84cc16', // Lime
      '#a855f7', // Purple
    ]
    
    // Use index to select color, cycling through palette
    const colorIndex = index % colorPalette.length
    return colorPalette[colorIndex]
  }

  const handleDragStart = (order: ChinaDivisionOrderInfo, sourceLabel: string | null) => {
    setDraggedOrder({ order, sourceLabel })
  }

  const handleDragOver = (e: React.DragEvent, label: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverLabel(label)
  }

  const handleDragLeave = () => {
    setDragOverLabel(null)
  }

  const handleDrop = (e: React.DragEvent, targetLabel: string | null) => {
    e.preventDefault()
    setDragOverLabel(null)
    
    if (!draggedOrder) return

    const { order, sourceLabel } = draggedOrder

    // Remove from source label
    if (sourceLabel) {
      onRemoveLabelFromOrder(order, sourceLabel)
    }

    // Add to target label
    if (targetLabel) {
      onAddLabelToOrder(order, targetLabel)
    }

    setDraggedOrder(null)
  }

  const handleDragEnd = () => {
    setDraggedOrder(null)
    setDragOverLabel(null)
  }

  // Drag handlers for label columns
  const handleLabelColumnDragStart = (e: React.DragEvent, label: string) => {
    e.stopPropagation() // Prevent triggering order drag
    setDraggedLabelColumn(label)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', label)
  }

  const handleLabelColumnDragOver = (e: React.DragEvent, targetLabel: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedLabelColumn && draggedLabelColumn !== targetLabel) {
      setDragOverLabelColumn(targetLabel)
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleLabelColumnDragLeave = () => {
    setDragOverLabelColumn(null)
  }

  const handleLabelColumnDrop = (e: React.DragEvent, targetLabel: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverLabelColumn(null)
    
    if (!draggedLabelColumn || draggedLabelColumn === targetLabel) {
      setDraggedLabelColumn(null)
      return
    }

    // Use the current displayed order (getAllLabels) to find positions
    // This includes all labels in their current display order
    const currentOrder = getAllLabels
    const sourceIndex = currentOrder.indexOf(draggedLabelColumn)
    const targetIndex = currentOrder.indexOf(targetLabel)
    
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedLabelColumn(null)
      return
    }

    // Create new order based on current display order
    const newOrder = [...currentOrder]
    newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, draggedLabelColumn)
    
    // Update the labelOrder state with the new order
    // This will trigger getAllLabels to recalculate with the new order
    onReorderLabels(newOrder)
    setDraggedLabelColumn(null)
  }

  const handleLabelColumnDragEnd = () => {
    setDraggedLabelColumn(null)
    setDragOverLabelColumn(null)
  }

  return (
    <>
      {/* Create Label Section - Above Alerts */}
      <div className="flex gap-2 items-center mb-4">
        <Input
          type="text"
          placeholder="New label name..."
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newLabelName.trim()) {
              onAddLabel()
            }
          }}
          className="h-10 max-w-xs"
        />
        <Button
          type="button"
          onClick={onAddLabel}
          disabled={!newLabelName.trim()}
          style={{
            backgroundColor: primaryColor,
            borderColor: primaryColor,
            color: '#ffffff',
          }}
        >
          <Icon size="sm"><PlusIcon className="h-4 w-4" /></Icon>
          <span className="ml-1">Create Label</span>
        </Button>
      </div>

      {/* Alerts Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Unlabeled Orders Column - Always visible */}
      <div className={`flex-shrink-0 transition-all duration-300 ${isUnlabeledCollapsed ? 'w-16' : 'w-80'}`}>
        <Card 
          className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg transition-all ${dragOverLabel === null && draggedOrder ? 'ring-2 ring-blue-500' : ''}`}
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              {isUnlabeledCollapsed ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsUnlabeledCollapsed(false)}
                    className="h-8 w-8 p-0"
                    title="Expand Unlabeled"
                  >
                    <Icon size="xs"><ChevronRightIcon className="h-4 w-4" /></Icon>
                  </Button>
                  <Badge variant="secondary" className="text-xs">{getUnlabeledOrders().length}</Badge>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <span>Unlabeled</span>
                    <Badge variant="secondary">{getUnlabeledOrders().length}</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsUnlabeledCollapsed(true)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                    title="Collapse Unlabeled"
                  >
                    <Icon size="xs"><ChevronLeftIcon className="h-3 w-3" /></Icon>
                  </Button>
                </>
              )}
            </CardTitle>
          </CardHeader>
          {!isUnlabeledCollapsed && (
            <CardContent className="space-y-3">
              {getUnlabeledOrders().length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                  Drop orders here to remove labels
                </p>
              ) : (
                getUnlabeledOrders().map(order => (
                  <AlertsOrderCard
                    key={getOrderKey(order)}
                    order={order}
                    orderKey={getOrderKey(order)}
                    primaryColor={primaryColor}
                    onViewDetails={() => onViewDetails(order)}
                    onAddLabel={(label) => onAddLabelToOrder(order, label)}
                    availableLabels={getAllLabels}
                    getStatusBadge={getStatusBadge}
                    getTrackStatusBadge={getTrackStatusBadge}
                    onDragStart={() => handleDragStart(order, null)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedOrder?.order === order}
                  />
                ))
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Label Columns */}
      {getAllLabels.map((label, index) => {
        const labelOrders = getOrdersForLabel(label)
        const labelColor = getLabelColor(label, index)
        return (
          <div key={label} className="flex-shrink-0 w-80">
            <Card 
              className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-lg transition-all ${dragOverLabel === label ? 'ring-2' : ''} ${dragOverLabelColumn === label ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                borderLeft: `4px solid ${labelColor}`,
                ...(dragOverLabel === label ? { borderColor: labelColor } : {})
              }}
              onDragOver={(e) => {
                // Only handle order drag if not dragging a label column
                if (!draggedLabelColumn) {
                  handleDragOver(e, label)
                } else {
                  // Handle label column drag
                  handleLabelColumnDragOver(e, label)
                }
              }}
              onDragLeave={(e) => {
                if (!draggedLabelColumn) {
                  handleDragLeave()
                } else {
                  handleLabelColumnDragLeave()
                }
              }}
              onDrop={(e) => {
                // Only handle order drop if not dragging a label column
                if (!draggedLabelColumn) {
                  handleDrop(e, label)
                } else {
                  // Handle label column drop
                  handleLabelColumnDrop(e, label)
                }
              }}
            >
              <CardHeader 
                className={`pb-3 cursor-move ${draggedLabelColumn === label ? 'opacity-50' : ''} ${dragOverLabelColumn === label ? 'ring-2 ring-blue-500' : ''}`}
                draggable
                onDragStart={(e) => handleLabelColumnDragStart(e, label)}
                onDragOver={(e) => handleLabelColumnDragOver(e, label)}
                onDragLeave={handleLabelColumnDragLeave}
                onDrop={(e) => handleLabelColumnDrop(e, label)}
                onDragEnd={handleLabelColumnDragEnd}
              >
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon size="xs" className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </Icon>
                    <span className="truncate" style={{ color: labelColor }}>{label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveLabel(label)
                      }}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <Icon size="xs"><XMarkIcon className="h-3 w-3" /></Icon>
                    </Button>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="ml-2 flex-shrink-0"
                    style={{
                      backgroundColor: `${labelColor}20`,
                      color: labelColor,
                      borderColor: labelColor,
                    }}
                  >
                    {labelOrders.length}
                  </Badge>
                </CardTitle>
                <div className="mt-2 space-y-2">
                  {/* Add new email input */}
                  <div className="flex gap-1">
                    <Input
                      type="email"
                      placeholder="Email to recieve alerts"
                      value={newEmailForLabel[label] || ''}
                      onChange={(e) => {
                        setNewEmailForLabel(prev => ({ ...prev, [label]: e.target.value }))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newEmailForLabel[label]?.trim()) {
                          addLabelEmail(label, newEmailForLabel[label])
                          setNewEmailForLabel(prev => {
                            const next = { ...prev }
                            delete next[label]
                            return next
                          })
                        }
                      }}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newEmailForLabel[label]?.trim()) {
                          addLabelEmail(label, newEmailForLabel[label])
                          setNewEmailForLabel(prev => {
                            const next = { ...prev }
                            delete next[label]
                            return next
                          })
                        }
                      }}
                      disabled={!newEmailForLabel[label]?.trim()}
                      className="h-8 px-2"
                    >
                      <Icon size="xs"><PlusIcon className="h-3 w-3" /></Icon>
                    </Button>
                  </div>
                  
                  {/* Display existing emails */}
                  {getLabelEmails(label).length > 0 && (
                    <div className="space-y-1">
                      {getLabelEmails(label).map((email, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1">
                          <span className="text-xs flex-1 truncate">{email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => sendTestEmailForLabel(label, email)}
                            className="h-6 px-1.5 text-xs"
                            title="Send test email"
                          >
                            <Icon size="xs"><PaperAirplaneIcon className="h-3 w-3" /></Icon>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLabelEmail(label, email)}
                            className="h-6 px-1.5"
                            title="Remove email"
                          >
                            <Icon size="xs"><XMarkIcon className="h-3 w-3" /></Icon>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {labelOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                    {dragOverLabel === label ? 'Drop here' : 'No orders in this label'}
                  </p>
                ) : (
                  labelOrders.map(order => (
                    <AlertsOrderCard
                      key={getOrderKey(order)}
                      order={order}
                      orderKey={getOrderKey(order)}
                      primaryColor={primaryColor}
                      onViewDetails={() => onViewDetails(order)}
                      onRemoveLabel={() => onRemoveLabelFromOrder(order, label)}
                      currentLabel={label}
                      getStatusBadge={getStatusBadge}
                      getTrackStatusBadge={getTrackStatusBadge}
                      onDragStart={() => handleDragStart(order, label)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedOrder?.order === order}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
      </div>
    </>
  )
}

function AlertsOrderCard({
  order,
  orderKey,
  primaryColor,
  onViewDetails,
  onAddLabel,
  onRemoveLabel,
  availableLabels,
  currentLabel,
  getStatusBadge,
  getTrackStatusBadge,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  order: ChinaDivisionOrderInfo
  orderKey: string
  primaryColor: string
  onViewDetails: () => void
  onAddLabel?: (label: string) => void
  onRemoveLabel?: () => void
  availableLabels?: string[]
  currentLabel?: string
  getStatusBadge: (status?: number, statusName?: string) => React.ReactNode
  getTrackStatusBadge: (trackStatus?: number, trackStatusName?: string) => React.ReactNode
  onDragStart?: () => void
  onDragEnd?: () => void
  isDragging?: boolean
}) {
  return (
    <Card
      className={`bg-white dark:bg-slate-800 border cursor-pointer hover:shadow-md transition-all ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'hover:scale-[1.02]'}`}
      onClick={onViewDetails}
      draggable={!!onDragStart}
      onDragStart={(e) => {
        if (onDragStart) {
          onDragStart()
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', orderKey)
        }
      }}
      onDragEnd={(e) => {
        if (onDragEnd) {
          onDragEnd()
        }
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {order.first_name} {order.last_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order {order.order_id}
              </p>
            </div>
            {onRemoveLabel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveLabel()
                }}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <Icon size="xs"><XMarkIcon className="h-3 w-3" /></Icon>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {getStatusBadge(order.status, order.status_name)}
            {getTrackStatusBadge(order.track_status, order.track_status_name)}
          </div>
          {order.ship_city && order.ship_state && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              📍 {order.ship_city}, {order.ship_state}
            </p>
          )}
          {onAddLabel && availableLabels && availableLabels.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs mb-1 block">Add to label:</Label>
              <div className="flex flex-wrap gap-1">
                {availableLabels.map(label => (
                  <Button
                    key={label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddLabel(label)
                    }}
                    className="h-6 text-xs px-2"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

