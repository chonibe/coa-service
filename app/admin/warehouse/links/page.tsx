'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  Calendar,
  Eye,
  Search,
  Edit,
  Palette,
  Image,
  Grid3x3,
  List,
  TrendingUp,
  Clock,
  QrCode,
  Filter,
  ArrowUpDown,
  MoreVertical,
  CheckCircle,
  Package
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'

interface TrackingLink {
  id: string
  token: string
  url: string
  title: string | null
  orderCount: number
  accessCount: number
  lastAccessedAt: string | null
  expiresAt: string | null
  createdAt: string
  logoUrl?: string | null
  primaryColor?: string
  orderIds?: string[]
}

export default function ManageLinksPage() {
  const [links, setLinks] = useState<TrackingLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<TrackingLink | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [linkToEdit, setLinkToEdit] = useState<TrackingLink | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState('')
  const [editPrimaryColor, setEditPrimaryColor] = useState('#8217ff')
  const [editOrderIds, setEditOrderIds] = useState<string[]>([])
  const [availableOrders, setAvailableOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [sortBy, setSortBy] = useState<'created' | 'accessed' | 'title' | 'orders'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all')
  const { toast } = useToast()

  // Predefined color options
  const colorOptions = [
    { name: 'Purple', value: '#8217ff' },
    { name: 'Red', value: '#ff4f44' },
    { name: 'Dark Blue', value: '#110034' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
  ]

  const fetchLinks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/warehouse-orders/share')
      const data = await response.json()

      console.log('[Manage Links] API Response:', { 
        ok: response.ok, 
        status: response.status,
        hasLinks: !!data.links,
        linksCount: data.links?.length || 0,
        dataKeys: Object.keys(data)
      })

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tracking links')
      }

      // Handle both response formats: { success: true, links } or { links }
      const linksArray = data.links || []
      console.log('[Manage Links] Setting links:', linksArray.length)
      setLinks(linksArray)
    } catch (err: any) {
      console.error('Error fetching links:', err)
      setError(err.message || 'Failed to load tracking links')
      toast({
        title: "Error",
        description: err.message || "Failed to load tracking links.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleCopyLink = (link: TrackingLink) => {
    navigator.clipboard.writeText(link.url).then(() => {
      setCopiedLinkId(link.id)
      setTimeout(() => setCopiedLinkId(null), 2000)
      toast({
        title: "Link Copied!",
        description: "The tracking link has been copied to your clipboard.",
      })
    })
  }

  const handleEditClick = async (link: TrackingLink) => {
    setLinkToEdit(link)
    setEditTitle(link.title || '')
    setEditLogoUrl(link.logoUrl || '')
    setEditPrimaryColor(link.primaryColor || '#8217ff')
    setEditOrderIds(link.orderIds || [])
    setOrderSearchQuery('')
    setEditDialogOpen(true)
    
    // Fetch available orders for selection
    await fetchAvailableOrders()
  }

  const fetchAvailableOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 365)
      const startDateStr = startDate.toISOString().split('T')[0]

      const response = await fetch(`/api/warehouse/orders?start=${startDateStr}&end=${endDate}`)
      const data = await response.json()

      if (response.ok && data.orders) {
        setAvailableOrders(data.orders || [])
      }
    } catch (err: any) {
      console.error('Error fetching available orders:', err)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!linkToEdit) return

    if (editOrderIds.length === 0) {
      toast({
        title: "Error",
        description: "At least one order must be included in the link.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/warehouse-orders/share/${linkToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle || null,
          logoUrl: editLogoUrl || null,
          primaryColor: editPrimaryColor,
          orderIds: editOrderIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update link')
      }

      toast({
        title: "Link Updated",
        description: "The tracking link has been updated successfully.",
      })

      setEditDialogOpen(false)
      setLinkToEdit(null)
      fetchLinks() // Refresh the list
    } catch (err: any) {
      console.error('Error updating link:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to update tracking link.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (link: TrackingLink) => {
    setLinkToDelete(link)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!linkToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/warehouse-orders/share/${linkToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete link')
      }

      toast({
        title: "Link Deleted",
        description: "The tracking link has been deleted successfully.",
      })

      setDeleteDialogOpen(false)
      setLinkToDelete(null)
      fetchLinks() // Refresh the list
    } catch (err: any) {
      console.error('Error deleting link:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete tracking link.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate stats
  const stats = {
    total: links.length,
    active: links.filter(l => !isExpired(l.expiresAt)).length,
    expired: links.filter(l => isExpired(l.expiresAt)).length,
    totalViews: links.reduce((sum, l) => sum + l.accessCount, 0),
    totalOrders: links.reduce((sum, l) => sum + l.orderCount, 0),
  }

  // Filter and sort links
  const filteredLinks = links
    .filter((link) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !link.title?.toLowerCase().includes(query) &&
          !link.url.toLowerCase().includes(query) &&
          !link.token.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      
      // Status filter
      if (statusFilter === 'active' && isExpired(link.expiresAt)) return false
      if (statusFilter === 'expired' && !isExpired(link.expiresAt)) return false
      
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'accessed':
          const aLast = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
          const bLast = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
          comparison = aLast - bLast
          break
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'orders':
          comparison = a.orderCount - b.orderCount
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Manage Tracking Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, customize, and manage shareable tracking links for your customers
          </p>
        </div>
        <Button onClick={fetchLinks} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Links</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <LinkIcon className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, URL, or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired')}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created' | 'accessed' | 'title' | 'orders')}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="created">Sort by Created</option>
                <option value="accessed">Sort by Last Accessed</option>
                <option value="title">Sort by Title</option>
                <option value="orders">Sort by Orders</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-10"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 border rounded-md overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-10 px-3 rounded-none ${viewMode === 'card' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('card')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-10 px-3 rounded-none ${viewMode === 'table' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Links Table */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading tracking links...</p>
          </CardContent>
        </Card>
      ) : filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No links found matching your search.' : 'No tracking links created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLinks.map((link) => (
            <Card 
              key={link.id}
              className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden"
              style={{
                borderLeft: `4px solid ${link.primaryColor || '#8217ff'}`,
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {link.title || 'Untitled Link'}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {link.orderCount} {link.orderCount === 1 ? 'order' : 'orders'}
                    </CardDescription>
                  </div>
                  {isExpired(link.expiresAt) ? (
                    <Badge variant="destructive" className="flex-shrink-0">Expired</Badge>
                  ) : (
                    <Badge variant="default" className="flex-shrink-0 bg-green-500">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Design Preview */}
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  {link.logoUrl && (
                    <img 
                      src={link.logoUrl} 
                      alt="Logo" 
                      className="h-6 w-auto object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  {link.primaryColor && (
                    <div 
                      className="w-6 h-6 rounded border-2 border-background shadow-sm"
                      style={{ backgroundColor: link.primaryColor }}
                      title={link.primaryColor}
                    />
                  )}
                  {!link.logoUrl && !link.primaryColor && (
                    <span className="text-xs text-muted-foreground">Default design</span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground">Views</div>
                    <div className="font-semibold">{link.accessCount}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground">Orders</div>
                    <div className="font-semibold">{link.orderCount}</div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {formatDate(link.createdAt)}</span>
                  </div>
                  {link.lastAccessedAt && (
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      <span>Last viewed: {formatDate(link.lastAccessedAt)}</span>
                    </div>
                  )}
                  {link.expiresAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Expires: {formatDate(link.expiresAt)}</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopyLink(link)}
                  >
                    {copiedLinkId === link.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(link)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(link)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Tracking Links ({filteredLinks.length})</CardTitle>
            <CardDescription>
              All shareable tracking links you've created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Access Count</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Design</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        {link.title || <span className="text-muted-foreground">Untitled</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{link.orderCount}</Badge>
                      </TableCell>
                      <TableCell>{link.accessCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(link.lastAccessedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(link.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {link.expiresAt ? formatDate(link.expiresAt) : 'Never'}
                      </TableCell>
                      <TableCell>
                        {isExpired(link.expiresAt) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {link.logoUrl && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Image className="h-3 w-3" />
                              Logo
                            </div>
                          )}
                          {link.primaryColor && (
                            <div 
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: link.primaryColor }}
                              title={link.primaryColor}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(link)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(link)}
                          >
                            {copiedLinkId === link.id ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(link)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Tracking Page Design</DialogTitle>
            <DialogDescription>
              Customize the logo and colors for this tracking link
            </DialogDescription>
          </DialogHeader>
          {linkToEdit && (
            <div className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Page Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Order Tracking"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="edit-logo">Company Logo URL</Label>
                <Input
                  id="edit-logo"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                {editLogoUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img 
                      src={editLogoUrl} 
                      alt="Logo preview" 
                      className="h-16 w-auto object-contain border rounded p-2 bg-gray-50"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="edit-color">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      id="edit-color"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      placeholder="#8217ff"
                      className="font-mono"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick Select:</p>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditPrimaryColor(color.value)}
                        className={`w-10 h-10 rounded border-2 transition-all ${
                          editPrimaryColor === color.value 
                            ? 'border-gray-900 scale-110' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Color Preview:</p>
                  <div 
                    className="h-12 rounded flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: editPrimaryColor }}
                  >
                    {editPrimaryColor}
                  </div>
                </div>
              </div>

              {/* Order Management */}
              <div className="space-y-2">
                <Label>Orders in Link ({editOrderIds.length})</Label>
                
                {/* Current Orders List */}
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {editOrderIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No orders added</p>
                  ) : (
                    editOrderIds.map((orderId) => {
                      // Find the order in availableOrders to get the Platform Order ID
                      const order = availableOrders.find(o => 
                        (o.sys_order_id || o.order_id) === orderId
                      )
                      const platformOrderId = order?.order_id || 'N/A'
                      const recipientName = order ? `${order.first_name || ''} ${order.last_name || ''}`.trim() : ''
                      
                      return (
                        <div 
                          key={orderId}
                          className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            {recipientName && (
                              <p className="text-sm font-medium truncate">{recipientName}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Platform ID:</span>
                              <span className="font-mono text-xs">{platformOrderId}</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">System ID: {orderId}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditOrderIds(editOrderIds.filter(id => id !== orderId))
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Add Orders Section */}
                <div className="space-y-2">
                  <Label>Add Orders</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by order ID, recipient name, or email..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Available Orders List */}
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                    {isLoadingOrders ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Loading orders...</p>
                    ) : (
                      availableOrders
                        .filter(order => {
                          if (!orderSearchQuery) return true
                          const query = orderSearchQuery.toLowerCase()
                          const orderId = order.sys_order_id || order.order_id || ''
                          const recipientName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase()
                          const email = order.ship_email?.toLowerCase() || ''
                          return (
                            orderId.toLowerCase().includes(query) ||
                            recipientName.includes(query) ||
                            email.includes(query)
                          )
                        })
                        .filter(order => {
                          const orderId = order.sys_order_id || order.order_id || ''
                          return orderId && !editOrderIds.includes(orderId)
                        })
                        .slice(0, 20) // Limit to 20 results for performance
                        .map((order) => {
                          const orderId = order.sys_order_id || order.order_id || ''
                          const platformOrderId = order.order_id || 'N/A'
                          const recipientName = `${order.first_name || ''} ${order.last_name || ''}`.trim()
                          return (
                            <div
                              key={orderId}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => {
                                if (orderId && !editOrderIds.includes(orderId)) {
                                  setEditOrderIds([...editOrderIds, orderId])
                                  setOrderSearchQuery('')
                                }
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{recipientName || 'Unknown'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">Platform ID:</span>
                                  <span className="text-xs font-mono font-medium">{platformOrderId}</span>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">System ID: {orderId}</span>
                                {order.ship_email && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">{order.ship_email}</p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (orderId && !editOrderIds.includes(orderId)) {
                                    setEditOrderIds([...editOrderIds, orderId])
                                    setOrderSearchQuery('')
                                  }
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })
                    )}
                    {availableOrders.length === 0 && !isLoadingOrders && (
                      <p className="text-sm text-muted-foreground text-center py-4">No orders available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setLinkToEdit(null)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tracking Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tracking link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {linkToDelete && (
            <div className="space-y-2 py-4">
              <div className="text-sm">
                <span className="font-medium">Title:</span> {linkToDelete.title || 'Untitled'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Orders:</span> {linkToDelete.orderCount}
              </div>
              <div className="text-sm">
                <span className="font-medium">URL:</span>{' '}
                <span className="text-muted-foreground font-mono text-xs break-all">
                  {linkToDelete.url}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setLinkToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

