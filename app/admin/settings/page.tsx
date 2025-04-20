"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAssignEditions: true,
    editionFormat: "number",
    updateShopify: true,
    syncOnWebhook: true,
  })

  const [vendors, setVendors] = useState<any[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      // Fetch vendors from Shopify
      const shopifyResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/vendors.json`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      })

      if (!shopifyResponse.ok) {
        throw new Error(`Failed to fetch vendors from Shopify: ${shopifyResponse.status}`)
      }

      const shopifyData = await shopifyResponse.json()
      const shopifyVendors = shopifyData.vendors || []

      // Fetch vendors from Supabase
      const { data: supabaseVendors, error: supabaseError } = await supabase
        .from("instagram_profiles")
        .select("vendor_id")

      if (supabaseError) {
        throw new Error(`Failed to fetch vendors from Supabase: ${supabaseError.message}`)
      }

      // Combine and deduplicate vendors
      const allVendors = [
        ...new Set([
          ...shopifyVendors.map((v: any) => v.name),
          ...(supabaseVendors?.map((v: any) => v.vendor_id) || []),
        ]),
      ]
      setVendors(allVendors)
    } catch (error: any) {
      console.error("Error fetching vendors:", error)
    }
  }

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
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="edition-format">Edition number format</Label>
                    <Select
                      value={settings.editionFormat}
                      onValueChange={(value) => setSettings({ ...settings, editionFormat: value })}
                    >
                      <SelectTrigger id="edition-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number only (e.g., 42)</SelectItem>
                        <SelectItem value="number-of-total">Number of total (e.g., 42/100)</SelectItem>
                        <SelectItem value="custom">Custom format</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How edition numbers should be formatted when displayed
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced options for the edition numbering system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="update-shopify">Update Shopify line items</Label>
                      <p className="text-sm text-muted-foreground">
                        Update Shopify line item properties with edition numbers
                      </p>
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
                      <Label htmlFor="sync-webhook">Sync on webhook</Label>
                      <p className="text-sm text-muted-foreground">
                        Process edition numbers when order webhooks are received
                      </p>
                    </div>
                    <Switch
                      id="sync-webhook"
                      checked={settings.syncOnWebhook}
                      onCheckedChange={(checked) => setSettings({ ...settings, syncOnWebhook: checked })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
