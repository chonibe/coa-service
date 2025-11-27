"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Plus, FileText, Key, Video, Package, Percent, Eye, Trash2, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { SidebarLayout } from "../../components/sidebar-layout"
import { PullToRefresh } from "@/components/pull-to-refresh"

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

export default function BenefitsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [benefits, setBenefits] = useState<any[]>([])
  const [benefitTypes, setBenefitTypes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    benefitTypeId: "",
    description: "",
    contentUrl: "",
    accessCode: "",
    startsAt: "",
    expiresAt: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      // Fetch vendor data
      const vendorResponse = await fetch("/api/vendor/profile", {
        credentials: "include",
      })
      if (!vendorResponse.ok) {
        if (vendorResponse.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch vendor data")
      }
      const vendorData = await vendorResponse.json()
      setVendor(vendorData.vendor)

      // Fetch vendor products
      const productsResponse = await fetch(
        `/api/vendors/products?vendor=${encodeURIComponent(vendorData.vendor.vendor_name)}`,
      )
      if (!productsResponse.ok) {
        throw new Error("Failed to fetch products")
      }
      const productsData = await productsResponse.json()
      setProducts(productsData.products || [])

      // Fetch benefit types
      const typesResponse = await fetch("/api/benefits/types")
      if (!typesResponse.ok) {
        throw new Error("Failed to fetch benefit types")
      }
      const typesData = await typesResponse.json()
      setBenefitTypes(typesData.types || [])

      if (productsData.products && productsData.products.length > 0) {
        const firstProduct = selectedProduct || productsData.products[0]
        setSelectedProduct(firstProduct)
        await fetchBenefits(firstProduct.id)
      }
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [router, selectedProduct])

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

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await fetchData()
    toast({
      title: "Refreshed",
      description: "Benefits data has been updated",
      duration: 2000,
    })
  }

  const handleProductChange = async (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setSelectedProduct(product)
    await fetchBenefits(productId)
  }

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        title: "",
        benefitTypeId: "",
        description: "",
        contentUrl: "",
        accessCode: "",
        startsAt: "",
        expiresAt: "",
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.benefitTypeId || !selectedProduct) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/benefits/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          vendor_name: vendor.vendor_name,
          benefit_type_id: Number.parseInt(formData.benefitTypeId),
          title: formData.title,
          description: formData.description,
          content_url: formData.contentUrl,
          access_code: formData.accessCode,
          starts_at: formData.startsAt || null,
          expires_at: formData.expiresAt || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create benefit")
      }

      toast({
        title: "Success",
        description: "Benefit created successfully",
      })

      // Close dialog and refresh benefits
      handleDialogOpen(false)
      await fetchBenefits(selectedProduct.id)
    } catch (err: any) {
      console.error("Error creating benefit:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create benefit",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBenefit = async (id: number) => {
    if (!confirm("Are you sure you want to delete this benefit?")) {
      return
    }

    try {
      const response = await fetch(`/api/benefits/delete?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete benefit")
      }

      toast({
        title: "Success",
        description: "Benefit deleted successfully",
      })

      // Refresh benefits
      await fetchBenefits(selectedProduct.id)
    } catch (err: any) {
      console.error("Error deleting benefit:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete benefit",
      })
    }
  }

  if (isLoading && !vendor) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading benefits...</h2>
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
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-muted-foreground text-lg">Create special perks and benefits for your collectors</p>
          </div>

          <Card className="mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Your Collector Benefits</CardTitle>
              <CardDescription>Add value to your limited editions by offering exclusive perks to collectors</CardDescription>
            </CardHeader>
            <CardContent>
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

                <div className="flex items-end">
                  <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full md:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Benefit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>Create a New Benefit</DialogTitle>
                        <DialogDescription>
                          Add something special for collectors of {selectedProduct?.title}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="benefit-type">Benefit Type *</Label>
                          <Select
                            value={formData.benefitTypeId}
                            onValueChange={(value) => setFormData({ ...formData, benefitTypeId: value })}
                          >
                            <SelectTrigger id="benefit-type">
                              <SelectValue placeholder="Select a benefit type" />
                            </SelectTrigger>
                            <SelectContent>
                              {benefitTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  <div className="flex items-center">
                                    {getBenefitIcon(type.name)}
                                    <span className="ml-2">{type.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            placeholder="Enter benefit title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Enter benefit description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="content-url">Content URL</Label>
                          <Input
                            id="content-url"
                            placeholder="https://example.com/content"
                            value={formData.contentUrl}
                            onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                          />
                          <p className="text-sm text-muted-foreground">
                            Link to digital content, event page, or related resource
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="access-code">Access Code</Label>
                          <Input
                            id="access-code"
                            placeholder="Optional access code"
                            value={formData.accessCode}
                            onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                          />
                          <p className="text-sm text-muted-foreground">
                            Optional code collectors will need to access this benefit
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="starts-at">Starts At</Label>
                            <Input
                              id="starts-at"
                              type="datetime-local"
                              value={formData.startsAt}
                              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="expires-at">Expires At</Label>
                            <Input
                              id="expires-at"
                              type="datetime-local"
                              value={formData.expiresAt}
                              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          onClick={handleSubmit} 
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Benefit"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : benefits.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No benefits yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start rewarding your collectors! Click "Create Benefit" above to add something special for this product.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {benefits.map((benefit) => (
                    <Card key={benefit.id} className="overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteBenefit(benefit.id)}
                          >
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
                        {benefit.access_code && (
                          <div className="text-sm mb-1">
                            <span className="font-medium">Access Code:</span> {benefit.access_code}
                          </div>
                        )}
                        {(benefit.starts_at || benefit.expires_at) && (
                          <div className="text-xs text-muted-foreground mt-3">
                            {benefit.starts_at && (
                              <div>Starts: {format(new Date(benefit.starts_at), "MMM d, yyyy h:mm a")}</div>
                            )}
                            {benefit.expires_at && (
                              <div>Expires: {format(new Date(benefit.expires_at), "MMM d, yyyy h:mm a")}</div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>About Collector Benefits</CardTitle>
              <CardDescription>Discover how benefits can make your limited editions even more valuable</CardDescription>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </PullToRefresh>
    </SidebarLayout>
  )
}
