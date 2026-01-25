"use client"

import { useState, useEffect } from "react"







import { AlertCircle, CheckCircle, Loader2, User, Package, Smartphone, ShieldCheck, Info } from "lucide-react"
import Link from "next/link"
import { mockResponseData } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Alert, AlertDescription, AlertTitle, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from "@/components/ui"
export default function AuthenticatePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [lineItems, setLineItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("scan")
  const [nfcTagId, setNfcTagId] = useState("")
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null)
  const [isClaimingNfc, setIsClaimingNfc] = useState(false)
  const [claimedTags, setClaimedTags] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Check login status
  useEffect(() => {
    // In a real implementation, this would check if the user is logged in to Shopify
    // For demo purposes, we'll simulate a logged-in user
    const checkLoginStatus = () => {
      setTimeout(() => {
        setIsLoggedIn(true)
        setCustomerId("12345678")
      }, 1000)
    }

    checkLoginStatus()
  }, [])

  // Fetch orders when logged in
  useEffect(() => {
    if (isLoggedIn && customerId) {
      fetchOrdersByCustomerId(customerId)
    }
  }, [isLoggedIn, customerId])

  // Fetch orders and certificates
  const fetchOrdersByCustomerId = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, this would fetch from your API
      // For demo purposes, we'll use mock data
      const data = mockResponseData

      setOrders(data.orders)

      // Process line items
      const newLineItems: any[] = []
      data.orders.forEach((order: any) => {
        order.line_items.forEach((item: any) => {
          // Only include items with certificates
          if (item.is_limited_edition) {
            newLineItems.push({
              ...item,
              order_info: order,
              // Simulate certificate URL
              certificate_url: `/certificate/${item.line_item_id}`,
              // Randomly determine if this certificate has been claimed
              is_claimed: Math.random() > 0.7,
            })
          }
        })
      })

      setLineItems(newLineItems)
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(err.message || "An error occurred while fetching your orders")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle NFC tag scanning
  const handleNfcScan = async () => {
    if ("NDEFReader" in window) {
      try {
        setError(null)
        setActiveTab("scan")

        const ndef = new (window as any).NDEFReader()
        await ndef.scan()

        console.log("Scan started successfully")
        ndef.onreading = ({ message, serialNumber }: any) => {
          console.log("NDEF message read")

          // Use the serial number as the tag ID
          if (serialNumber) {
            setNfcTagId(serialNumber)
            setActiveTab("pair")
          }
        }
      } catch (error) {
        console.error("Error scanning NFC:", error)
        setError("Could not start NFC scanning. Make sure NFC is enabled on your device.")
      }
    } else {
      setError("NFC is not supported on this device or browser. Try using the manual entry method.")
    }
  }

  // Handle manual NFC tag ID entry
  const handleManualEntry = () => {
    if (!nfcTagId.trim()) {
      setError("Please enter an NFC tag ID")
      return
    }

    setError(null)
    setActiveTab("pair")
  }

  // Handle claiming/pairing an NFC tag with a certificate
  const handleClaimNfc = async () => {
    if (!selectedCertificate) {
      setError("Please select a certificate to pair with this NFC tag")
      return
    }
    if (!nfcTagId.trim()) {
      setError("Scan or enter your NFC tag ID before pairing")
      return
    }

    setIsClaimingNfc(true)
    setError(null)
    setSuccess(null)

    try {
      const orderId = selectedCertificate.order_info?.order_id || selectedCertificate.order_id

      if (!("NDEFReader" in window)) {
        throw new Error("NFC is not supported in this browser. Try a supported device.")
      }

      // Prepare signed unlock URL
      const signResponse = await fetch("/api/nfc-tags/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId: nfcTagId,
          lineItemId: selectedCertificate.line_item_id,
          orderId,
        }),
      })

      const signData = await signResponse.json()
      if (!signResponse.ok || !signData.success) {
        throw new Error(signData.message || "Failed to prepare NFC payload")
      }

      const unlockUrl = signData.unlockUrl || selectedCertificate.certificate_url

      // Write to NTAG (Web NFC)
      const ndef = new (window as any).NDEFReader()
      await ndef.write({
        records: [
          { recordType: "url", data: unlockUrl },
          { recordType: "text", data: `Certificate for ${selectedCertificate.title || "artwork"}` },
        ],
      })

      // Claim in backend
      const claimResponse = await fetch("/api/nfc-tags/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId: nfcTagId,
          lineItemId: selectedCertificate.line_item_id,
          orderId,
          customerId: customerId || undefined,
        }),
      })

      const claimData = await claimResponse.json()
      if (!claimResponse.ok || !claimData.success) {
        throw new Error(claimData.message || "Failed to pair NFC tag with certificate")
      }

      // Update local state to show this certificate as claimed
      setClaimedTags({
        ...claimedTags,
        [selectedCertificate.line_item_id]: true,
      })

      setSuccess(`NFC tag ${nfcTagId} locked to ${selectedCertificate.title}. Artist content will unlock on scan.`)

      // Reset selection
      setSelectedCertificate(null)
      setNfcTagId("")
      setActiveTab("certificates")
    } catch (err: any) {
      console.error("Error claiming NFC tag:", err)
      setError(err.message || "Failed to pair NFC tag with certificate")
    } finally {
      setIsClaimingNfc(false)
    }
  }

  // Handle selecting a certificate for pairing
  const handleSelectCertificate = (item: any) => {
    setSelectedCertificate(item)
  }

  // Render loading state
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Checking your account...</h2>
          <p className="text-muted-foreground">Please wait while we verify your login status</p>
        </div>
      </div>
    )
  }

  // Render login required view
  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">Please log in to authenticate your product</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <User className="h-16 w-16 text-primary mb-6" />
            <p className="text-center mb-6">
              You need to be logged in to authenticate your product and view your certificates.
            </p>
            <Button className="w-full">Log In to Your Account</Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="#" className="text-primary hover:underline">
                Create one now
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Product Authentication</h1>
          <p className="text-muted-foreground">Authenticate your product and view your digital certificates</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="scan">Scan NFC Tag</TabsTrigger>
            <TabsTrigger value="pair">Pair Certificate</TabsTrigger>
            <TabsTrigger value="certificates">Your Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <Card>
              <CardHeader>
                <CardTitle>Scan Your NFC Tag</CardTitle>
                <CardDescription>Scan the NFC tag on your product to begin the authentication process</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-gray-100 p-8 rounded-full mb-6">
                  <Smartphone className="h-16 w-16 text-primary" />
                </div>
                <div className="text-center mb-8 max-w-md">
                  <h3 className="text-lg font-medium mb-2">How to Scan</h3>
                  <p className="text-muted-foreground mb-4">
                    Hold your phone near the NFC tag on your product. Make sure NFC is enabled on your device.
                  </p>
                  <Button onClick={handleNfcScan} className="mb-2">
                    Start NFC Scan
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    NFC not working?{" "}
                    <button className="text-primary hover:underline" onClick={() => setActiveTab("manual")}>
                      Enter tag ID manually
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual Tag Entry</CardTitle>
                <CardDescription>Enter the NFC tag ID printed on your product or packaging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nfc-id">NFC Tag ID</Label>
                    <Input
                      id="nfc-id"
                      placeholder="Enter the NFC tag ID (e.g., NT12345678)"
                      value={nfcTagId}
                      onChange={(e) => setNfcTagId(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      The NFC tag ID is typically printed on the tag or packaging
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleManualEntry}>Continue</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="pair">
            <Card>
              <CardHeader>
                <CardTitle>Pair with Certificate</CardTitle>
                <CardDescription>Select which certificate to pair with NFC tag: {nfcTagId}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : lineItems.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No certificates found</AlertTitle>
                    <AlertDescription>
                      You don't have any certificates available for pairing. Purchase a limited edition product to get a
                      certificate.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Select one of your certificates below to pair with this NFC tag:
                    </p>
                    {lineItems.map((item) => {
                      const isClaimed = claimedTags[item.line_item_id] || item.is_claimed
                      return (
                        <div
                          key={`${item.order_info.order_id}-${item.line_item_id}`}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedCertificate?.line_item_id === item.line_item_id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-gray-50"
                          } ${isClaimed ? "opacity-50" : ""}`}
                          onClick={() => !isClaimed && handleSelectCertificate(item)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Order #{item.order_info.order_number} •{" "}
                                {new Date(item.order_info.processed_at).toLocaleDateString()}
                              </p>
                            </div>
                            {isClaimed ? (
                              <Badge variant="outline" className="bg-gray-100">
                                Already Claimed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Available
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("scan")}>
                  Back
                </Button>
                <Button onClick={handleClaimNfc} disabled={!selectedCertificate || isClaimingNfc}>
                  {isClaimingNfc ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Pairing...
                    </>
                  ) : (
                    "Pair with Certificate"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Your Certificates</CardTitle>
                <CardDescription>View and manage your product certificates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : lineItems.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No certificates found</AlertTitle>
                    <AlertDescription>
                      You don't have any certificates yet. Purchase a limited edition product to get a certificate.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {lineItems.map((item) => {
                      const isClaimed = claimedTags[item.line_item_id] || item.is_claimed
                      return (
                        <div key={`${item.order_info.order_id}-${item.line_item_id}`} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Order #{item.order_info.order_number} •{" "}
                                {new Date(item.order_info.processed_at).toLocaleDateString()}
                              </p>
                            </div>
                            {isClaimed ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Authenticated
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Authenticated</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={item.certificate_url} target="_blank">
                                View Certificate
                              </Link>
                            </Button>
                            {!isClaimed && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedCertificate(item)
                                  setActiveTab("scan")
                                }}
                              >
                                Authenticate Now
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">How Authentication Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">1. Scan NFC Tag</h3>
              <p className="text-sm text-muted-foreground">Scan the NFC tag on your product using your smartphone</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">2. Select Certificate</h3>
              <p className="text-sm text-muted-foreground">
                Choose which product certificate to pair with this NFC tag
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">3. Authenticate</h3>
              <p className="text-sm text-muted-foreground">Complete the pairing to authenticate your product</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
