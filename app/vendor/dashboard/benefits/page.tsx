"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, FileText, Key, Video, Package, Percent, Eye, Trash2, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Get icon based on benefit type
const getBenefitIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "digital content":
      return <FileText className="h-4 w-4" />
    case "exclusive access":
      return <Key className="h-4 w-4" />
    case "virtual event":
      return <Video className="h-4 w-4" />
    case "physical item":
      return <Package className="h-4 w-4" />
    case "discount":
      return <Percent className="h-4 w-4" />
    case "behind the scenes":
      return <Eye className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

interface Benefit {
  id: number
  title: string
  description: string | null
  content_url: string | null
  benefit_types: {
    name: string
    icon: string
  }
}

interface Product {
  id: string
  title: string
}

export default function BenefitsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [benefitTypes, setBenefitTypes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setIsLoading(true)
        const vendorResponse = await fetch("/api/vendor/profile")
        if (!vendorResponse.ok) {
          if (vendorResponse.status === 401) {
            router.push("/vendor/login")
            return
          }
          throw new Error("Failed to fetch vendor data")
        }
        const vendorData = await vendorResponse.json()
        setVendor(vendorData.vendor)

        const productsResponse = await fetch(
          `/api/vendors/products?vendor=${encodeURIComponent(vendorData.vendor.vendor_name)}`,
        )
        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products")
        }
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])

        const typesResponse = await fetch("/api/benefits/types")
        if (!typesResponse.ok) {
          throw new Error("Failed to fetch benefit types")
        }
        const typesData = await typesResponse.json()
        setBenefitTypes(typesData.types || [])

        if (productsData.products && productsData.products.length > 0) {
          setSelectedProduct(productsData.products[0])
          await fetchBenefits(productsData.products[0].id)
        }
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorData()
  }, [router])

  const fetchBenefits = async (productId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/benefits/list?product_id=${productId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch benefits")
      }
      const data = await response.json()
      setBenefits(data.benefits || [])
    } catch (err: any) {
      console.error("Error fetching benefits:", err)
      setError(err.message || "Failed to load benefits")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductChange = async (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setSelectedProduct(product)
    await fetchBenefits(productId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Vendor Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium hidden sm:block">
              Welcome, <span className="text-primary">{vendor?.vendor_name}</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push("/vendor/dashboard")} className="h-8">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Collector Benefits</h1>
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
            <CardTitle>Manage Benefits</CardTitle>
            <CardDescription>Create and manage benefits for collectors of your limited editions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="product-select">Select Product</Label>
                    <Select value={selectedProduct?.id} onValueChange={handleProductChange}>
                      <SelectTrigger id="product-select">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {benefits.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-gray-50">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No benefits yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You haven't created any benefits for this product yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {benefits.map((benefit) => (
                      <Card key={benefit.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                          <div>
                            <div className="flex items-center mb-1">
                              {getBenefitIcon(benefit.benefit_types.name)}
                              <Badge variant="outline" className="ml-2">
                                {benefit.benefit_types.name}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">{benefit.title}</CardTitle>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          {benefit.description && (
                            <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                          )}
                          {benefit.content_url && (
                            <div className="text-sm mb-1">
                              <span className="font-medium">URL:</span>{" "}
                              <a
                                href={benefit.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {benefit.content_url.substring(0, 30)}
                                {benefit.content_url.length > 30 ? "..." : ""}
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Collector Benefits</CardTitle>
            <CardDescription>Learn how to use benefits to add value to your limited editions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">What are collector benefits?</h3>
                <p className="text-muted-foreground">
                  Collector benefits are additional value you provide to your customers who purchase your limited
                  edition products. Similar to how Patreon and Verisart work, these benefits can increase the value of
                  your editions and build collector loyalty.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Types of benefits you can offer:</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-medium">Digital Content</span> - PDFs, videos, exclusive images, etc.
                  </li>
                  <li>
                    <span className="font-medium">Exclusive Access</span> - Early access to new products or content
                  </li>
                  <li>
                    <span className="font-medium">Virtual Events</span> - Livestreams, webinars, Q&A sessions
                  </li>
                  <li>
                    <span className="font-medium">Physical Items</span> - Signed prints, merchandise, etc.
                  </li>
                  <li>
                    <span className="font-medium">Discounts</span> - Special pricing on future purchases
                  </li>
                  <li>
                    <span className="font-medium">Behind the Scenes</span> - Process videos, stories, etc.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">How it works:</h3>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>Create benefits for your products using this dashboard</li>
                  <li>Collectors who purchase your limited editions can claim these benefits</li>
                  <li>You can set start and expiration dates for time-sensitive benefits</li>
                  <li>Track which benefits are most popular to refine your offerings</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
