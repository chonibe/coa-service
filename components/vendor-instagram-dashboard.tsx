"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  Instagram,
  Search,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Download,
  Upload,
  Database,
  RefreshCw,
  Server,
  ShoppingBag,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VendorInstagramUrl {
  vendor: string
  instagram_url: string | null
  updated_at: string
  synced?: boolean
}

interface TestResult {
  name: string
  status: "success" | "error" | "pending"
  message: string
  timestamp: string
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
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isTestingConnection, setIsTestingConnection] = useState(false)
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

  // Add a test result
  const addTestResult = (name: string, status: "success" | "error" | "pending", message: string) => {
    const newResult: TestResult = {
      name,
      status,
      message,
      timestamp: new Date().toISOString(),
    }
    setTestResults((prev) => [newResult, ...prev.slice(0, 19)]) // Keep last 20 results
  }

  // Test database connection
  const testDatabaseConnection = async () => {
    setIsTestingConnection(true)
    addTestResult("Database Connection", "pending", "Testing database connection...")

    try {
      const response = await fetch("/api/test/database-connection")
      const data = await response.json()

      if (data.success) {
        addTestResult("Database Connection", "success", `Connected to database: ${data.message}`)
        setDbConnectionError(false)
      } else {
        addTestResult("Database Connection", "error", `Failed to connect to database: ${data.error}`)
        setDbConnectionError(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addTestResult("Database Connection", "error", `Error testing database connection: ${errorMessage}`)
      setDbConnectionError(true)
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Test Shopify connection
  const testShopifyConnection = async () => {
    addTestResult("Shopify Connection", "pending", "Testing Shopify API connection...")

    try {
      const response = await fetch("/api/test/shopify-connection")
      const data = await response.json()

      if (data.success) {
        addTestResult("Shopify Connection", "success", `Connected to Shopify: ${data.message}`)
      } else {
        addTestResult("Shopify Connection", "error", `Failed to connect to Shopify: ${data.error}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addTestResult("Shopify Connection", "error", `Error testing Shopify connection: ${errorMessage}`)
    }
  }

  // Test Instagram URL table
  const testInstagramUrlTable = async () => {
    addTestResult("Instagram URL Table", "pending", "Testing Instagram URL table...")

    try {
      const response = await fetch("/api/test/instagram-url-table")
      const data = await response.json()

      if (data.success) {
        addTestResult("Instagram URL Table", "success", `Instagram URL table exists: ${data.count} records found`)
      } else {
        addTestResult("Instagram URL Table", "error", `Instagram URL table issue: ${data.error}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addTestResult("Instagram URL Table", "error", `Error testing Instagram URL table: ${errorMessage}`)
    }
  }

  // Sync local data with database
  const syncLocalData = async () => {
    addTestResult("Data Sync", "pending", "Syncing local data with database...")

    try {
      // Get unsynced URLs
      const unsyncedUrls = vendorUrls.filter((url) => !url.synced)

      if (unsyncedUrls.length === 0) {
        addTestResult("Data Sync", "success", "No unsynced data to sync")
        return
      }

      let successCount = 0
      let errorCount = 0

      // Try to sync each URL
      for (const url of unsyncedUrls) {
        try {
          const response = await fetch("/api/instagram/vendor-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vendor: url.vendor,
              instagram_url: url.instagram_url,
            }),
          })

          const data = await response.json()

          if (data.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (err) {
          errorCount++
        }
      }

      // Update local state
      if (successCount > 0) {
        const updatedUrls = vendorUrls.map((url) => (!url.synced ? { ...url, synced: true } : url))
        setVendorUrls(updatedUrls)
        saveToLocalStorage(updatedUrls)
      }

      addTestResult(
        "Data Sync",
        errorCount === 0 ? "success" : "error",
        `Synced ${successCount} URLs, ${errorCount} errors`,
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addTestResult("Data Sync", "error", `Error syncing data: ${errorMessage}`)
    }
  }

  // Run all tests
  const runAllTests = async () => {
    await testDatabaseConnection()
    await testShopifyConnection()
    await testInstagramUrlTable()
  }

  // Fetch vendors and their Instagram URLs
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setDbConnectionError(false)
      addTestResult("Initial Load", "pending", "Loading vendors and Instagram URLs...")

      try {
        // Fetch all vendors from Shopify
        const vendorsResponse = await fetch("/api/shopify/vendors")
        if (!vendorsResponse.ok) {
          const errorText = await vendorsResponse.text()
          console.error("Shopify vendors API error:", errorText)
          addTestResult("Shopify API", "error", `Failed to fetch vendors: ${errorText}`)
          throw new Error(`Failed to fetch vendors from Shopify: ${errorText}`)
        }
        const vendorsData = await vendorsResponse.json()
        setVendors(vendorsData.vendors || [])
        addTestResult("Shopify API", "success", `Fetched ${vendorsData.vendors?.length || 0} vendors`)

        // Fetch all Instagram URLs from our database
        const urlsResponse = await fetch("/api/instagram/vendor-urls")
        const urlsData = await urlsResponse.json()

        if (urlsData.error) {
          console.warn("Database error:", urlsData.error)
          setDbConnectionError(true)
          addTestResult("Database API", "error", `Database error: ${urlsData.error}`)

          // Load from local storage as fallback
          const localUrls = loadFromLocalStorage()
          setVendorUrls(localUrls)
          addTestResult("Local Storage", "success", `Loaded ${localUrls.length} URLs from local storage`)
        } else {
          // Merge database URLs with local storage
          const dbUrls = urlsData.urls || []
          const localUrls = loadFromLocalStorage()
          addTestResult("Database API", "success", `Fetched ${dbUrls.length} URLs from database`)

          // Prefer database URLs but mark them as synced
          const mergedUrls = dbUrls.map((dbUrl) => ({
            ...dbUrl,
            synced: true,
          }))

          // Add local URLs that don't exist in the database
          let localOnlyCount = 0
          localUrls.forEach((localUrl) => {
            if (!mergedUrls.some((url) => url.vendor === localUrl.vendor)) {
              mergedUrls.push({
                ...localUrl,
                synced: false,
              })
              localOnlyCount++
            }
          })

          setVendorUrls(mergedUrls)
          addTestResult("Data Merge", "success", `Merged data: ${dbUrls.length} from DB, ${localOnlyCount} local only`)

          // Update local storage with the merged data
          saveToLocalStorage(mergedUrls)
        }

        addTestResult("Initial Load", "success", "Successfully loaded vendors and Instagram URLs")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        addTestResult("Initial Load", "error", `Error loading data: ${errorMessage}`)
        console.error(err)

        // Load from local storage as fallback
        const localUrls = loadFromLocalStorage()
        setVendorUrls(localUrls)
        addTestResult("Local Storage", "success", `Loaded ${localUrls.length} URLs from local storage as fallback`)
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
    addTestResult("Save URL", "pending", `Saving Instagram URL for ${vendor}...`)

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
      addTestResult("Local Storage", "success", `Saved URL for ${vendor} to local storage`)

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

          const data = await response.json()

          if (data.success) {
            // Mark as synced if successful
            const syncedUrls = updatedUrls.map((url) => (url.vendor === vendor ? { ...url, synced: true } : url))
            setVendorUrls(syncedUrls)
            saveToLocalStorage(syncedUrls)
            addTestResult("Database Save", "success", `Saved URL for ${vendor} to database`)
          } else {
            console.warn("Failed to save to database, but saved locally")
            addTestResult("Database Save", "error", `Failed to save to database: ${data.error || "Unknown error"}`)
          }
        } catch (dbErr) {
          const errorMessage = dbErr instanceof Error ? dbErr.message : "Unknown error"
          console.warn("Database save error, but saved locally:", dbErr)
          addTestResult("Database Save", "error", `Database error: ${errorMessage}`)
        }
      }

      setEditingVendor(null)
      toast({
        title: "Success",
        description: dbConnectionError
          ? `Instagram URL for ${vendor} has been saved locally.`
          : `Instagram URL for ${vendor} has been updated.`,
      })

      addTestResult("Save URL", "success", `Successfully saved Instagram URL for ${vendor}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addTestResult("Save URL", "error", `Error saving URL: ${errorMessage}`)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
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

      addTestResult("Export", "success", `Exported ${vendorUrls.length} URLs to JSON file`)
      toast({
        title: "Export Successful",
        description: `${vendorUrls.length} Instagram URLs exported to JSON file.`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addTestResult("Export", "error", `Export failed: ${errorMessage}`)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: errorMessage,
      })
    }
  }

  // Import Instagram URLs from JSON file
  const importUrls = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    addTestResult("Import", "pending", `Importing URLs from ${file.name}...`)

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

        addTestResult("Import", "success", `Imported ${importCount} URLs from JSON file`)
        toast({
          title: "Import Successful",
          description: `${importCount} Instagram URLs imported.`,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        addTestResult("Import", "error", `Import failed: ${errorMessage}`)
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: errorMessage,
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
    <>
      <Card className="mb-6">
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
              <Button
                variant={showTestPanel ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTestPanel(!showTestPanel)}
              >
                <Server className="h-4 w-4 mr-1" />
                {showTestPanel ? "Hide Tests" : "Show Tests"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-2">
            {vendors.length} vendors found | {vendorUrls.filter((u) => !u.synced).length} unsynced changes
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveInstagramUrl(vendor)}
                          disabled={isSaving}
                        >
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

      {showTestPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              System Tests & Diagnostics
            </CardTitle>
            <CardDescription>Test connections and diagnose issues with the Instagram URL system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tests">
              <TabsList className="mb-4">
                <TabsTrigger value="tests">Connection Tests</TabsTrigger>
                <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                <TabsTrigger value="data">Data Management</TabsTrigger>
              </TabsList>

              <TabsContent value="tests">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Database Connection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex items-center mb-2">
                        <div
                          className={`h-3 w-3 rounded-full mr-2 ${dbConnectionError ? "bg-red-500" : "bg-green-500"}`}
                        ></div>
                        <span>{dbConnectionError ? "Disconnected" : "Connected"}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={testDatabaseConnection}
                        disabled={isTestingConnection}
                        className="mt-2"
                      >
                        {isTestingConnection ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Test Connection
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Shopify Connection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex items-center mb-2">
                        <div
                          className={`h-3 w-3 rounded-full mr-2 ${vendors.length > 0 ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span>{vendors.length > 0 ? `Connected (${vendors.length} vendors)` : "Connection issue"}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={testShopifyConnection} className="mt-2">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Test Connection
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between mb-4">
                  <Button onClick={runAllTests}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Run All Tests
                  </Button>

                  <Button variant="outline" onClick={syncLocalData}>
                    <Database className="h-4 w-4 mr-1" />
                    Sync Local Data
                  </Button>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="instagram-table">
                    <AccordionTrigger>Instagram URL Table</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Table Name:</span>
                          <span className="font-mono">vendor_instagram_urls</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Local Records:</span>
                          <span>{vendorUrls.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unsynced Records:</span>
                          <span>{vendorUrls.filter((u) => !u.synced).length}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={testInstagramUrlTable} className="mt-2">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Test Table
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="environment">
                    <AccordionTrigger>Environment Variables</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>SUPABASE_CONNECTION_STRING:</span>
                          <span>{process.env.SUPABASE_CONNECTION_STRING ? "Set" : "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SHOPIFY_ACCESS_TOKEN:</span>
                          <span>{process.env.SHOPIFY_ACCESS_TOKEN ? "Set" : "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SHOPIFY_SHOP:</span>
                          <span>{process.env.SHOPIFY_SHOP ? "Set" : "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CRON_SECRET:</span>
                          <span>{process.env.CRON_SECRET ? "Set" : "Not set"}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="logs">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium">System Activity Logs</h3>
                    <Button variant="outline" size="sm" onClick={() => setTestResults([])}>
                      Clear Logs
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {testResults.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No activity logs yet</div>
                    ) : (
                      <div className="divide-y">
                        {testResults.map((result, index) => (
                          <div key={index} className="p-3 flex items-start">
                            <div className="mr-3 mt-0.5">
                              {result.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                              {result.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                              {result.status === "pending" && (
                                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{result.name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(result.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{result.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Data Synchronization</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm text-gray-600 mb-4">
                        Sync local data with the database or export/import data for backup.
                      </p>
                      <div className="flex space-x-2">
                        <Button onClick={syncLocalData}>
                          <Database className="h-4 w-4 mr-1" />
                          Sync with Database
                        </Button>
                        <Button variant="outline" onClick={exportUrls}>
                          <Download className="h-4 w-4 mr-1" />
                          Export Data
                        </Button>
                        <div className="relative">
                          <Button variant="outline">
                            <Upload className="h-4 w-4 mr-1" />
                            Import Data
                          </Button>
                          <input
                            type="file"
                            accept=".json"
                            onChange={importUrls}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Data Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Total Vendors</div>
                          <div className="text-2xl font-bold">{vendors.length}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Instagram URLs</div>
                          <div className="text-2xl font-bold">{vendorUrls.length}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Unsynced</div>
                          <div className="text-2xl font-bold">{vendorUrls.filter((u) => !u.synced).length}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm text-gray-500">Configured %</div>
                          <div className="text-2xl font-bold">
                            {vendors.length > 0 ? Math.round((vendorUrls.length / vendors.length) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="w-full flex justify-between items-center">
              <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
              <Button variant="outline" size="sm" onClick={() => setShowTestPanel(false)}>
                Close Panel
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
