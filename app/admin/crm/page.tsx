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
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-6 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-10 w-10 rounded-full bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-xs">!</span>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          CRM Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage customer relationships across Orders, Email, and Instagram
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Customers</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats?.totalCustomers || 0}</div>
            <Link href="/admin/crm/customers">
              <Button variant="link" className="p-0 h-auto mt-2 text-blue-600 hover:text-blue-700">
                View all customers →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Conversations</CardTitle>
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats?.totalConversations || 0}</div>
            <Link href="/admin/crm/inbox">
              <Button variant="link" className="p-0 h-auto mt-2 text-indigo-600 hover:text-indigo-700">
                View inbox →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Open Conversations</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats?.openConversations || 0}</div>
            <Link href="/admin/crm/inbox?status=open">
              <Button variant="link" className="p-0 h-auto mt-2 text-orange-600 hover:text-orange-700">
                View open →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Instagram Messages</CardTitle>
            <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <Instagram className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats?.instagramConversations || 0}</div>
            <Link href="/admin/crm/inbox?platform=instagram">
              <Button variant="link" className="p-0 h-auto mt-2 text-pink-600 hover:text-pink-700">
                View Instagram →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Email Messages</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats?.emailConversations || 0}</div>
            <Link href="/admin/crm/inbox?platform=email">
              <Button variant="link" className="p-0 h-auto mt-2 text-green-600 hover:text-green-700">
                View Email →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-base">Common CRM tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/crm/inbox">
              <Button className="w-full justify-start h-11" variant="outline" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Open Inbox
              </Button>
            </Link>
            <Link href="/admin/crm/customers">
              <Button className="w-full justify-start h-11" variant="outline" size="lg">
                <Users className="mr-2 h-5 w-5" />
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
        className="w-full justify-start h-11"
        variant="outline"
        size="lg"
      >
        {isSyncing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Syncing Gmail...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-5 w-5" />
            Sync Gmail
          </>
        )}
      </Button>
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}

