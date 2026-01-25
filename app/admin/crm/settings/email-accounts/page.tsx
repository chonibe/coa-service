"use client"

import { useState, useEffect } from "react"



import { Loader2, Mail, Plus, CheckCircle, XCircle, RefreshCw } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
interface EmailAccount {
  id: string
  account_name: string
  email_address: string
  provider: string
  is_active: boolean
  is_default: boolean
  sync_enabled: boolean
  last_synced_at: string | null
}

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/crm/email-accounts")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`)
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err: any) {
      console.error("Error fetching email accounts:", err)
      setError(err.message || "Failed to load email accounts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (accountId: string) => {
    try {
      const response = await fetch(`/api/crm/email-accounts/${accountId}/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to sync")
      }

      // Refresh accounts list
      fetchAccounts()
    } catch (err: any) {
      console.error("Error syncing account:", err)
      alert(err.message || "Failed to sync account")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage email accounts for CRM syncing
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Email Account
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No email accounts connected</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Email Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {account.account_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {account.email_address} • {account.provider}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                    {account.is_active ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {account.last_synced_at
                      ? `Last synced: ${new Date(account.last_synced_at).toLocaleString()}`
                      : "Never synced"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(account.id)}
                      disabled={!account.is_active}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

