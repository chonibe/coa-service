"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Facebook, MessageCircle, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const platform = searchParams.get("platform")
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])

  useEffect(() => {
    if (platform === "facebook") {
      fetchFacebookAccounts()
    } else if (platform === "whatsapp") {
      fetchWhatsAppAccounts()
    }
  }, [platform])

  const fetchFacebookAccounts = async () => {
    try {
      // TODO: Implement fetch Facebook accounts
      // const response = await fetch("/api/crm/facebook/connect")
      // const data = await response.json()
      // setConnectedAccounts(data.accounts || [])
    } catch (err) {
      console.error("Error fetching Facebook accounts:", err)
    }
  }

  const fetchWhatsAppAccounts = async () => {
    try {
      // TODO: Implement fetch WhatsApp accounts
      // const response = await fetch("/api/crm/whatsapp/connect")
      // const data = await response.json()
      // setConnectedAccounts(data.accounts || [])
    } catch (err) {
      console.error("Error fetching WhatsApp accounts:", err)
    }
  }

  const handleFacebookConnect = async () => {
    setIsConnecting(true)
    try {
      // TODO: Implement Facebook OAuth flow
      // This would redirect to Facebook OAuth
      alert("Facebook OAuth integration coming soon. This will redirect to Facebook to authorize your pages.")
    } catch (err) {
      console.error("Error connecting Facebook:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleWhatsAppConnect = async () => {
    setIsConnecting(true)
    try {
      // TODO: Implement WhatsApp Business API connection
      alert("WhatsApp Business API integration coming soon. You'll need to provide your API credentials.")
    } catch (err) {
      console.error("Error connecting WhatsApp:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  if (platform === "facebook") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Facebook Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect your Facebook Pages to sync Messenger conversations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5" />
              Connect Facebook Page
            </CardTitle>
            <CardDescription>
              Authorize access to your Facebook Pages to sync Messenger conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Instructions</Label>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-2">
                  <li>Click "Connect Facebook" below</li>
                  <li>Authorize the app to access your Facebook Pages</li>
                  <li>Select which pages you want to connect</li>
                  <li>Conversations will automatically sync</li>
                </ol>
              </div>

              <Button
                onClick={handleFacebookConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="mr-2 h-4 w-4" />
                    Connect Facebook
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {connectedAccounts.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Connected Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{account.page_name}</div>
                      <div className="text-sm text-muted-foreground">{account.page_id}</div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (platform === "whatsapp") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect your WhatsApp Business API account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Connect WhatsApp Business API
            </CardTitle>
            <CardDescription>
              Configure your WhatsApp Business API credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  placeholder="e.g., Main Business Account"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="+1234567890"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="business_account_id">Business Account ID</Label>
                <Input
                  id="business_account_id"
                  placeholder="Your WhatsApp Business Account ID"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Your API key"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Instructions</Label>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-2">
                  <li>Get your WhatsApp Business API credentials from your provider</li>
                  <li>Enter your account details above</li>
                  <li>Configure webhook URL: <code className="bg-muted px-1 rounded">https://dashboard.thestreetlamp.com/api/webhooks/whatsapp</code></li>
                  <li>Click "Connect" to save and start syncing</li>
                </ol>
              </div>

              <Button
                onClick={handleWhatsAppConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Connect WhatsApp
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {connectedAccounts.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{account.account_name}</div>
                      <div className="text-sm text-muted-foreground">{account.phone_number}</div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-center py-8 text-muted-foreground">
        Select an integration from the settings page
      </div>
    </div>
  )
}

