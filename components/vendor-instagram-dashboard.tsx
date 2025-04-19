"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Instagram, Search, ExternalLink, Check, X, AlertCircle, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VendorInstagramUrl {
  vendor: string
  instagram_url: string | null
  updated_at: string
  synced?: boolean
}

// Local storage key for Instagram URLs
const LOCAL_STORAGE_KEY = "vendor_instagram_urls"

export function VendorInstagramDashboard() {
  const [vendors, setVendors] = useState<string[]>([])
  const [vendorUrls, setVendorUrls] = useState<VendorInstagramUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbConnectionError, setDbConnectionError] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingVendor, setEditingVendor] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load Instagram URLs from local storage
  const loadFromLocalStorage = () => {
    try {
      const savedUrls = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (savedUrls) {
        return JSON.parse(savedUrls) as VendorInstagramUrl[]
      }
    } catch (err) {
      console.error("Error loading from local storage:", err)
    }
    return []
  }

  // Save Instagram URLs to local storage
  const saveToLocalStorage = (urls: VendorInstagramUrl[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(urls))
    } catch (err) {
      console.error("Error saving to local storage:", err)
    }
  }

  // Fetch vendors and their Instagram URLs
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setDbConnectionError(false)

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
        const urlsData = await urlsResponse.json()

        if (urlsData.error) {
          console.warn("Database error:", urlsData.error)
          setDbConnectionError(true)

          // Load from local storage as fallback
          const localUrls = loadFromLocalStorage()
          setVendorUrls(localUrls)
        } else {
          // Merge database URLs with local storage
          const dbUrls = urlsData.urls || []
          const localUrls = loadFromLocalStorage()

          // Prefer database URLs but mark them as synced
          const mergedUrls = dbUrls.map((dbUrl) => ({
            ...dbUrl,
            synced: true,
          }))

          // Add local URLs that don't exist in the database
          localUrls.forEach((localUrl) => {
            if (!mergedUrls.some((url) => url.vendor === localUrl.vendor)) {
              mergedUrls.push({
                ...localUrl,
                synced: false,
              })
            }
          })

          setVendorUrls(mergedUrls)

          // Update local storage with the merged data
          saveToLocalStorage(mergedUrls)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error(err)

        // Load from local storage as fallback
        const localUrls = loadFromLocalStorage()
        setVendorUrls(localUrls)
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

  // Check if a vendor URL is synced with the database
  const isVendorUrlSynced = (vendor: string) => {
    const vendorUrl = vendorUrls.find((v) => v.vendor === vendor)
    return vendorUrl?.synced || false
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
      // Update local state first
      const now = new Date().toISOString()
      const updatedUrls = vendorUrls.map((url) =>
        url.vendor === vendor ? { ...url, instagram_url: editUrl, updated_at: now, synced: false } : url,
      )

      // If vendor doesn't exist in the list, add it
      if (!updatedUrls.some((url) => url.vendor === vendor)) {
        updatedUrls.push({
          vendor,
          instagram_url: editUrl,
          updated_at: now,
          synced: false,
        })
      }

      setVendorUrls(updatedUrls)
      saveToLocalStorage(updatedUrls)

      // Try to save to database if connection is available
      if (!dbConnectionError) {
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

          if (response.ok) {
            // Mark as synced if successful
            const syncedUrls = updatedUrls.map((url) => (url.vendor === vendor ? { ...url, synced: true } : url))
            setVendorUrls(syncedUrls)
            saveToLocalStorage(syncedUrls)
          } else {
            console.warn("Failed to save to database, but saved locally")
          }
        } catch (dbErr) {
          console.warn("Database save error, but saved locally:", dbErr)
        }
      }

      setEditingVendor(null)
      toast({
        title: "Success",
        description: dbConnectionError
          ? `Instagram URL for ${vendor} has been saved locally.`
          : `Instagram URL for ${vendor} has been updated.`,
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

  // Export Instagram URLs to JSON file
  const exportUrls = () => {
    try {
      const dataStr = JSON.stringify(vendorUrls, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `instagram_urls_${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Export Successful",
        description: `${vendorUrls.length} Instagram URLs exported to JSON file.`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export Instagram URLs",
      })
    }
  }

  // Import Instagram URLs from JSON file
  const importUrls = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedUrls = JSON.parse(content) as VendorInstagramUrl[]

        // Merge with existing URLs
        const mergedUrls = [...vendorUrls]
        let importCount = 0

        importedUrls.forEach((importedUrl) => {
          const existingIndex = mergedUrls.findIndex((url) => url.vendor === importedUrl.vendor)
          if (existingIndex >= 0) {
            mergedUrls[existingIndex] = {
              ...importedUrl,
              synced: false,
            }
          } else {
            mergedUrls.push({
              ...importedUrl,
              synced: false,
            })
          }
          importCount++
        })

        setVendorUrls(mergedUrls)
        saveToLocalStorage(mergedUrls)

        toast({
          title: "Import Successful",
          description: `${importCount} Instagram URLs imported.`,
        })
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: err instanceof Error ? err.message : "Failed to import Instagram URLs",
        })
      }
    }
    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
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
        {dbConnectionError && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Connection Issue</AlertTitle>
            <AlertDescription>
              Unable to connect to the database. Changes will be saved locally and can be synced later.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportUrls}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importUrls}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-2">{vendors.length} vendors found</div>

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
                    <div>
                      <a
                        href={getInstagramUrl(vendor) || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        {getInstagramUrl(vendor)}
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </a>
                      <div className="flex items-center mt-1">
                        {getLastUpdated(vendor) && (
                          <span className="text-xs text-gray-400 mr-2">Last updated: {getLastUpdated(vendor)}</span>
                        )}
                        {!isVendorUrlSynced(vendor) && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                            Not synced
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not configured</span>
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
