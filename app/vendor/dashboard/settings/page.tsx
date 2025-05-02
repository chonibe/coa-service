"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SidebarLayout } from "../../components/sidebar-layout"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [vendor, setVendor] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [formData, setFormData] = useState({
    paypalEmail: "",
    notifyOnSale: true,
    notifyOnPayout: true,
    notifyOnMessage: true,
  })

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const response = await fetch("/api/vendor/profile")

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/vendor/login")
            return
          }
          throw new Error("Failed to fetch vendor data")
        }

        const data = await response.json()
        setVendor(data.vendor)
        setFormData({
          paypalEmail: data.vendor.paypal_email || "",
          notifyOnSale: data.vendor.notify_on_sale !== false,
          notifyOnPayout: data.vendor.notify_on_payout !== false,
          notifyOnMessage: data.vendor.notify_on_message !== false,
        })
      } catch (err: any) {
        console.error("Error fetching vendor data:", err)
        setError(err.message || "Failed to load vendor data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorData()
  }, [router])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const response = await fetch("/api/vendor/update-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paypalEmail: formData.paypalEmail,
          notifyOnSale: formData.notifyOnSale,
          notifyOnPayout: formData.notifyOnPayout,
          notifyOnMessage: formData.notifyOnMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error updating settings:", err)
      setError(err.message || "Failed to update settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading settings...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input id="vendor-name" value={vendor?.vendor_name || ""} disabled />
                <p className="text-sm text-muted-foreground">
                  Your vendor name cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypal-email">PayPal Email</Label>
                <Input
                  id="paypal-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.paypalEmail}
                  onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">We'll send your payouts to this PayPal email address</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control which notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-sales">Sales Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications when your products are sold</p>
                </div>
                <Switch
                  id="notify-sales"
                  checked={formData.notifyOnSale}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyOnSale: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-payouts">Payout Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications when payouts are processed</p>
                </div>
                <Switch
                  id="notify-payouts"
                  checked={formData.notifyOnPayout}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyOnPayout: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-messages">Message Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications when you get new messages</p>
                </div>
                <Switch
                  id="notify-messages"
                  checked={formData.notifyOnMessage}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyOnMessage: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {saveSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your settings have been saved successfully.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
