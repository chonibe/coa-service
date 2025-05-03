"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Loader2, Save } from "lucide-react"
import { SidebarLayout } from "../../components/sidebar-layout"
import { PullToRefresh } from "@/components/pull-to-refresh"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [vendor, setVendor] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [paypalEmail, setPaypalEmail] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")
  const [bio, setBio] = useState("")

  const fetchVendorProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/profile")

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/vendor/login")
          return
        }
        throw new Error("Failed to fetch vendor profile")
      }

      const data = await response.json()
      setVendor(data.vendor)

      // Initialize form values
      setPaypalEmail(data.vendor.paypal_email || "")
      setInstagramUrl(data.vendor.instagram_url || "")
      setBio(data.vendor.bio || "")
    } catch (err: any) {
      console.error("Error fetching vendor profile:", err)
      setError(err.message || "Failed to load vendor profile")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchVendorProfile()
  }, [fetchVendorProfile])

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await fetchVendorProfile()
    toast({
      title: "Refreshed",
      description: "Your profile has been updated",
      duration: 2000,
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch("/api/vendor/update-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paypalEmail,
          instagramUrl,
          bio,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      toast({
        title: "Success",
        description: "Your settings have been saved",
      })

      // Refresh data
      await fetchVendorProfile()
    } catch (err: any) {
      console.error("Error saving settings:", err)
      setError(err.message || "Failed to save settings")

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !vendor) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading settings...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your profile data</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your vendor profile and payment settings</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Profile & Payment Settings</CardTitle>
              <CardDescription>Update your profile and payment information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This information is visible to customers and used for payments
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vendor-name">Vendor Name</Label>
                      <Input id="vendor-name" value={vendor?.vendor_name || ""} disabled />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your vendor name is synced from Shopify and cannot be changed here.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">Payment Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">How you'll receive payouts</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paypal-email">PayPal Email Address</Label>
                      <Input
                        id="paypal-email"
                        type="email"
                        placeholder="your-email@example.com"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        We'll send your payments to this PayPal address.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">Social Media</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your social media presence</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instagram-url">Instagram URL</Label>
                      <Input
                        id="instagram-url"
                        type="url"
                        placeholder="https://instagram.com/yourusername"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Your Instagram profile URL.</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium">Bio</h3>
                  <p className="text-sm text-muted-foreground mb-4">Tell customers about yourself</p>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about yourself and your work..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This may be displayed on your product pages or profile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PullToRefresh>
    </SidebarLayout>
  )
}
