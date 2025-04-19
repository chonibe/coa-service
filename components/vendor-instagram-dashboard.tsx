"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Instagram, Search, ExternalLink, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VendorInstagramUrl {
  vendor: string
  instagram_url: string | null
  updated_at: string
}

export function VendorInstagramDashboard() {
  const [vendors, setVendors] = useState<string[]>([])
  const [vendorUrls, setVendorUrls] = useState<VendorInstagramUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingVendor, setEditingVendor] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Fetch vendors and their Instagram URLs
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch all vendors from Shopify
        const vendorsResponse = await fetch("/api/shopify/vendors")
        if (!vendorsResponse.ok) {
          const errorText = await vendorsResponse.text()
          console.error("Shopify vendors API error:", errorText)
          throw new Error(`Failed to fetch vendors from Shopify: ${errorText}`)
        }
        const vendorsData = await vendorsResponse.json()
        setVendors(vendorsData.vendors || [])

        // Fetch all Instagram URLs from our database
        const urlsResponse = await fetch("/api/instagram/vendor-urls")
        if (!urlsResponse.ok) {
          throw new Error("Failed to fetch Instagram URLs")
        }
        const urlsData = await urlsResponse.json()
        setVendorUrls(urlsData.urls || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter vendors based on search query
  const filteredVendors = vendors.filter((vendor) => vendor.toLowerCase().includes(searchQuery.toLowerCase()))

  // Get Instagram URL for a vendor
  const getInstagramUrl = (vendor: string) => {
    const vendorUrl = vendorUrls.find((v) => v.vendor === vendor)
    return vendorUrl?.instagram_url || null
  }

  // Get last updated date for a vendor
  const getLastUpdated = (vendor: string) => {
    const vendorUrl = vendorUrls.find((v) => v.vendor === vendor)
    return vendorUrl?.updated_at ? new Date(vendorUrl.updated_at).toLocaleDateString() : null
  }

  // Start editing a vendor's Instagram URL
  const startEditing = (vendor: string) => {
    setEditingVendor(vendor)
    setEditUrl(getInstagramUrl(vendor) || "")
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingVendor(null)
    setEditUrl("")
  }

  // Save Instagram URL for a vendor
  const saveInstagramUrl = async (vendor: string) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/instagram/vendor-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor,
          instagram_url: editUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save Instagram URL")
      }

      // Update local state
      setVendorUrls((prev) => {
        const existing = prev.find((v) => v.vendor === vendor)
        if (existing) {
          return prev.map((v) =>
            v.vendor === vendor
              ? {
                  ...v,
                  instagram_url: editUrl,
                  updated_at: new Date().toISOString(),
                }
              : v,
          )
        } else {
          return [
            ...prev,
            {
              vendor,
              instagram_url: editUrl,
              updated_at: new Date().toISOString(),
            },
          ]
        }
      })

      setEditingVendor(null)
      toast({
        title: "Success",
        description: `Instagram URL for ${vendor} has been updated.`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save Instagram URL",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Instagram className="mr-2 h-5 w-5" />
          Vendor Instagram URLs
        </CardTitle>
        <CardDescription>
          Configure Instagram URLs for all vendors. These will be used on certificate pages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="mt-2 text-sm text-gray-500">{vendors.length} vendors found</div>
        </div>

        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-gray-500 border-b">
            <div className="col-span-4">Vendor</div>
            <div className="col-span-6">Instagram URL</div>
            <div className="col-span-2">Actions</div>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No vendors found matching your search.</div>
          ) : (
            filteredVendors.map((vendor) => (
              <div key={vendor} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center">
                <div className="col-span-4 font-medium">{vendor}</div>
                <div className="col-span-6">
                  {editingVendor === vendor ? (
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Enter Instagram URL"
                    />
                  ) : getInstagramUrl(vendor) ? (
                    <a
                      href={getInstagramUrl(vendor) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      {getInstagramUrl(vendor)}
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
                  )}
                  {getLastUpdated(vendor) && !editingVendor && (
                    <div className="text-xs text-gray-400 mt-1">Last updated: {getLastUpdated(vendor)}</div>
                  )}
                </div>
                <div className="col-span-2 flex space-x-2">
                  {editingVendor === vendor ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => saveInstagramUrl(vendor)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing} disabled={isSaving}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEditing(vendor)}>
                      {getInstagramUrl(vendor) ? "Edit" : "Add"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
