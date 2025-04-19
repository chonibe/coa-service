"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { getVendorInstagramUrls } from "@/lib/data-access"

interface VendorInstagramUrls {
  [vendor: string]: string
}

const AddInstagramUrls = () => {
  const [vendorInstagramUrls, setVendorInstagramUrls] = useState<VendorInstagramUrls>({})
  const [newVendor, setNewVendor] = useState("")
  const [newInstagramUrl, setNewInstagramUrl] = useState("")

  useEffect(() => {
    const fetchVendorInstagramUrls = async () => {
      const urls = await getVendorInstagramUrls()
      setVendorInstagramUrls(urls)
    }

    fetchVendorInstagramUrls()
  }, [])

  const handleAddVendorInstagramUrl = async () => {
    if (newVendor && newInstagramUrl) {
      try {
        const response = await fetch("/api/settings/instagram-urls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vendor: newVendor, instagramUrl: newInstagramUrl }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add vendor Instagram URL")
        }

        setVendorInstagramUrls((prev) => ({ ...prev, [newVendor]: newInstagramUrl }))
        setNewVendor("")
        setNewInstagramUrl("")
      } catch (error: any) {
        console.error("Error adding vendor Instagram URL:", error)
      }
    }
  }

  const handleDeleteVendorInstagramUrl = async (vendor: string) => {
    try {
      const response = await fetch(`/api/settings/instagram-urls?vendor=${vendor}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete vendor Instagram URL")
      }

      const { [vendor]: _, ...rest } = vendorInstagramUrls
      setVendorInstagramUrls(rest)
    } catch (error: any) {
      console.error("Error deleting vendor Instagram URL:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Instagram URLs</CardTitle>
        <CardDescription>Manage Instagram URLs for each vendor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {Object.entries(vendorInstagramUrls).map(([vendor, url]) => (
            <div key={vendor} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{vendor}</p>
                <p className="text-sm text-muted-foreground">{url}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteVendorInstagramUrl(vendor)}>
                Delete
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="new-vendor">New Vendor</Label>
          <Input
            id="new-vendor"
            placeholder="Enter vendor name"
            value={newVendor}
            onChange={(e) => setNewVendor(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-instagram-url">Instagram URL</Label>
          <Input
            id="new-instagram-url"
            type="url"
            placeholder="Enter Instagram URL"
            value={newInstagramUrl}
            onChange={(e) => setNewInstagramUrl(e.target.value)}
          />
        </div>
        <Button onClick={handleAddVendorInstagramUrl} disabled={!newVendor || !newInstagramUrl}>
          Add Vendor URL
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAssignEditions: true,
    editionFormat: "number",
    updateShopify: true,
    syncOnWebhook: true,
  })

  const handleSaveSettings = () => {
    // In a real app, this would save to your backend
    console.log("Saving settings:", settings)
    // Show a toast or notification
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your edition numbering system</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            <TabsTrigger value="instagram">Instagram Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Edition Numbering</CardTitle>
                <CardDescription>Configure how edition numbers are assigned and displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-assign">Auto-assign edition numbers</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign edition numbers to new orders
                      </p>
                    </div>
                    <Switch
                      id="auto-assign"
                      checked={settings.autoAssignEditions}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoAssignEditions: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="update-shopify">Update Shopify</Label>
                      <p className="text-sm text-muted-foreground">Automatically update Shopify with edition numbers</p>
                    </div>
                    <Switch
                      id="update-shopify"
                      checked={settings.updateShopify}
                      onCheckedChange={(checked) => setSettings({ ...settings, updateShopify: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sync-on-webhook">Sync on Webhook</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync edition numbers when a webhook is received from Shopify
                      </p>
                    </div>
                    <Switch
                      id="sync-on-webhook"
                      checked={settings.syncOnWebhook}
                      onCheckedChange={(checked) => setSettings({ ...settings, syncOnWebhook: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced settings for the edition numbering system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>Advanced settings coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instagram">
            <AddInstagramUrls />
          </TabsContent>
        </Tabs>

        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>
    </div>
  )
}
