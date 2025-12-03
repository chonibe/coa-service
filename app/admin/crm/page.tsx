"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, Users, Mail, Instagram, RefreshCw } from "lucide-react"
import Link from "next/link"

interface CRMStats {
  totalCustomers: number
  totalConversations: number
  openConversations: number
  instagramConversations: number
  emailConversations: number
}

export default function CRMDashboard() {
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        
        // Fetch customers count
        const customersRes = await fetch("/api/crm/customers?limit=1")
        const customersData = await customersRes.json()
        
        // Fetch conversations
        const conversationsRes = await fetch("/api/crm/conversations?limit=1000")
        const conversationsData = await conversationsRes.json()
        
        const conversations = conversationsData.conversations || []
        const openConversations = conversations.filter((c: any) => c.status === "open")
        const instagramConversations = conversations.filter((c: any) => c.platform === "instagram")
        const emailConversations = conversations.filter((c: any) => c.platform === "email")

        setStats({
          totalCustomers: customersData.total || 0,
          totalConversations: conversations.length,
          openConversations: openConversations.length,
          instagramConversations: instagramConversations.length,
          emailConversations: emailConversations.length,
        })
        setIsLoading(false)
      } catch (err: any) {
        console.error("Error fetching CRM stats:", err)
        setError(err.message || "Failed to load CRM stats")
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          CRM Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage customer relationships across Orders, Email, and Instagram
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <Link href="/admin/crm/customers">
              <Button variant="link" className="p-0 h-auto mt-2">
                View all customers →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
            <Link href="/admin/crm/inbox">
              <Button variant="link" className="p-0 h-auto mt-2">
                View inbox →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openConversations || 0}</div>
            <Link href="/admin/crm/inbox?status=open">
              <Button variant="link" className="p-0 h-auto mt-2">
                View open →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instagram Messages</CardTitle>
            <Instagram className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.instagramConversations || 0}</div>
            <Link href="/admin/crm/inbox?platform=instagram">
              <Button variant="link" className="p-0 h-auto mt-2">
                View Instagram →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emailConversations || 0}</div>
            <Link href="/admin/crm/inbox?platform=email">
              <Button variant="link" className="p-0 h-auto mt-2">
                View Email →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common CRM tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/crm/inbox">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Inbox
              </Button>
            </Link>
            <Link href="/admin/crm/customers">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Customers
              </Button>
            </Link>
            <GmailSyncButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function GmailSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasTriedAfterAuth, setHasTriedAfterAuth] = useState(false)

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/status")
        const data = await res.json()
        setIsAdmin(data.isAdmin || data.hasAdminSession)
      } catch (err) {
        console.error("Error checking admin status:", err)
      }
    }
    checkAdmin()
  }, [])

  const handleSync = async (isAutoRetry = false) => {
    try {
      setIsSyncing(true)
      setError(null)

      const response = await fetch("/api/crm/sync-gmail", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        console.error('[Gmail Sync] Error response:', errorData)
        
        if (errorData.requiresReauth) {
          // If we just tried after OAuth and still no access, show error instead of redirecting
          if (hasTriedAfterAuth || isAutoRetry) {
            setError(errorData.message || "Gmail access not available. Please log out completely and log back in using the admin login page. Make sure to approve Gmail permissions when prompted.")
            return
          }
          // First time - redirect to admin OAuth (always has Gmail scopes)
          window.location.href = `/api/auth/admin/google/start?redirect=${encodeURIComponent('/admin/crm?from_auth=true')}`
          return
        } else {
          // Show the actual error message from the server
          const errorMessage = errorData.error || errorData.message || `Failed to sync Gmail (${response.status})`
          if (errorData.debug) {
            console.error('[Gmail Sync] Debug info:', errorData.debug)
          }
          throw new Error(errorMessage)
        }
      }

      const data = await response.json()
      alert(`Successfully synced ${data.synced} emails from Gmail (${data.errors} errors)`)
      setError(null)
      setHasTriedAfterAuth(false) // Reset after successful sync
    } catch (err: any) {
      console.error("Error syncing Gmail:", err)
      setError(err.message || "Failed to sync Gmail")
    } finally {
      setIsSyncing(false)
    }
  }

  // Check if we just returned from OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get('from_auth') === 'true'
    
    if (fromAuth) {
      // Remove the parameter from URL
      urlParams.delete('from_auth')
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)
      setHasTriedAfterAuth(true)
      
      // Try sync automatically after returning from OAuth
      setTimeout(() => {
        handleSync(true)
      }, 1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Only show to admins
  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        className="w-full justify-start"
        variant="outline"
      >
        {isSyncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing Gmail...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Gmail
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

