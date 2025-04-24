"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Loader2,
  Plus,
  FileText,
  Key,
  Video,
  Package,
  Percent,
  Eye,
  Trash2,
  Edit,
  ArrowLeft,
  Calendar,
  LinkIcon,
  Code,
  Upload,
  Check,
  X,
  ExternalLink,
  PointerIcon as PreviewIcon,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

// Replace the getBenefitIcon function with this enhanced version
const getBenefitIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "digital content":
      return <FileText className="h-5 w-5 text-blue-500" />
    case "exclusive access":
      return <Key className="h-5 w-5 text-purple-500" />
    case "virtual event":
      return <Video className="h-5 w-5 text-red-500" />
    case "physical item":
      return <Package className="h-5 w-5 text-amber-500" />
    case "discount":
      return <Percent className="h-5 w-5 text-green-500" />
    case "behind the scenes":
      return <Eye className="h-5 w-5 text-indigo-500" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
  }
}

// Add this new component for the benefit preview
const BenefitPreview = ({ benefit, benefitType }: { benefit: any; benefitType: any }) => {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Collector Preview</h3>
        <p className="text-sm text-muted-foreground">How collectors will see this benefit</p>
      </div>
      <div className="p-6 bg-gray-50">
        <div className="max-w-md mx-auto bg-white border rounded-lg overflow-hidden shadow-md">
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              {getBenefitIcon(benefitType?.name)}
            </div>
            <div>
              <h4 className="font-medium">{benefit.title || "Benefit Title"}</h4>
              <p className="text-xs text-muted-foreground">{benefitType?.name || "Benefit Type"}</p>
            </div>
          </div>
          <div className="p-4">
            {benefit.description && <p className="text-sm mb-4">{benefit.description}</p>}

            {benefit.contentUrl && (
              <div className="flex items-center text-sm mb-3 p-2 bg-gray-50 rounded border">
                <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                <a
                  href={benefit.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {benefit.contentUrl}
                </a>
                <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
              </div>
            )}

            {benefit.accessCode && (
              <div className="flex items-center text-sm mb-3 p-2 bg-gray-50 rounded border">
                <Code className="h-4 w-4 mr-2 text-purple-500" />
                <span className="font-mono">{benefit.accessCode}</span>
              </div>
            )}

            {(benefit.startsAt || benefit.expiresAt) && (
              <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                {benefit.startsAt && (
                  <div className="flex items-center mb-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Available from: {format(new Date(benefit.startsAt), "MMM d, yyyy")}</span>
                  </div>
                )}
                {benefit.expiresAt && (
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Expires: {format(new Date(benefit.expiresAt), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 border-t">
            <Button size="sm" className="w-full">
              Claim Benefit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
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
  // Add these new state variables to the component
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewBenefit, setPreviewBenefit] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("details")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setIsLoading(true)
        // Fetch vendor data
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
      setEditingBenefitId(null)
    }
  }

  // Replace the existing handleSubmit function with this enhanced version
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

      const result = await response.json()

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

  // Add this new function for handling file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real implementation, you would upload the file to a storage service
      // and then set the URL in the form data
      toast({
        title: "File selected",
        description: `${file.name} (${Math.round(file.size / 1024)}KB)`,
      })

      // For demo purposes, we'll just set a placeholder URL
      setFormData({
        ...formData,
        contentUrl: `https://storage.example.com/${file.name}`,
      })
    }
  }

  // Add this new function for editing benefits
  const handleEditBenefit = (benefit: any) => {
    setFormData({
      title: benefit.title,
      benefitTypeId: benefit.benefit_type_id.toString(),
      description: benefit.description || "",
      contentUrl: benefit.content_url || "",
      accessCode: benefit.access_code || "",
      startsAt: benefit.starts_at ? new Date(benefit.starts_at).toISOString().slice(0, 16) : "",
      expiresAt: benefit.expires_at ? new Date(benefit.expires_at).toISOString().slice(0, 16) : "",
    })
    setEditingBenefitId(benefit.id)
    setIsDialogOpen(true)
  }

  // Add this new function for updating benefits
  const handleUpdateBenefit = async () => {
    if (!formData.title || !formData.benefitTypeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/benefits/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingBenefitId,
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
        throw new Error("Failed to update benefit")
      }

      toast({
        title: "Success",
        description: "Benefit updated successfully",
      })

      // Close dialog and refresh benefits
      handleDialogOpen(false)
      await fetchBenefits(selectedProduct.id)
    } catch (err: any) {
      console.error("Error updating benefit:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update benefit",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add this new function for previewing a benefit
  const handlePreviewBenefit = (benefit: any) => {
    setPreviewBenefit(benefit)
    setIsPreviewOpen(true)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading benefits...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Link href="/vendor/dashboard" className="mr-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Collector Benefits</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Benefits</CardTitle>
          <CardDescription>Create and manage benefits for collectors of your limited editions</CardDescription>
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
                    Add New Benefit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px]">
                  <DialogHeader>
                    <DialogTitle>{editingBenefitId ? "Edit Benefit" : "Add New Collector Benefit"}</DialogTitle>
                    <DialogDescription>
                      {editingBenefitId
                        ? `Update this benefit for collectors of ${selectedProduct?.title}`
                        : `Create a new benefit for collectors of ${selectedProduct?.title}`}
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Benefit Details</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 py-4">
                      <div className="grid gap-4">
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
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Content</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="content-url" className="text-sm">
                                  URL
                                </Label>
                                <div className="flex items-center">
                                  <Switch
                                    id="use-file"
                                    checked={!formData.contentUrl.startsWith("http")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        fileInputRef.current?.click()
                                      }
                                    }}
                                    size="sm"
                                  />
                                  <Label htmlFor="use-file" className="ml-2 text-xs">
                                    Upload File
                                  </Label>
                                </div>
                              </div>
                              <div className="flex">
                                <Input
                                  id="content-url"
                                  placeholder="https://example.com/content"
                                  value={formData.contentUrl}
                                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                                  className="rounded-r-none"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-l-none border-l-0"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Link to digital content, event page, or related resource
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="access-code" className="text-sm mb-2 block">
                                Access Code
                              </Label>
                              <Input
                                id="access-code"
                                placeholder="Optional access code"
                                value={formData.accessCode}
                                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Optional code collectors will need to access this benefit
                              </p>
                            </div>
                          </div>
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
                    </TabsContent>

                    <TabsContent value="preview">
                      <BenefitPreview
                        benefit={formData}
                        benefitType={benefitTypes.find((t) => t.id.toString() === formData.benefitTypeId)}
                      />
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={editingBenefitId ? handleUpdateBenefit : handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingBenefitId ? "Updating..." : "Creating..."}
                        </>
                      ) : editingBenefitId ? (
                        "Update Benefit"
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
                You haven't created any benefits for this product yet. Click "Add New Benefit" to get started.
              </p>
            </div>
          ) : (
            // Replace the benefits grid with this enhanced version
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
                        {!benefit.is_active && (
                          <Badge variant="secondary" className="ml-2">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{benefit.title}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handlePreviewBenefit(benefit)}
                      >
                        <PreviewIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditBenefit(benefit)}
                      >
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
                    {benefit.description && <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>}

                    <div className="space-y-2">
                      {benefit.content_url && (
                        <div className="flex items-center text-sm">
                          <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                          <a
                            href={benefit.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {benefit.content_url.substring(0, 30)}
                            {benefit.content_url.length > 30 ? "..." : ""}
                          </a>
                        </div>
                      )}

                      {benefit.access_code && (
                        <div className="flex items-center text-sm">
                          <Code className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="font-mono">{benefit.access_code}</span>
                        </div>
                      )}
                    </div>

                    {(benefit.starts_at || benefit.expires_at) && (
                      <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        {benefit.starts_at && (
                          <div className="flex items-center mb-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Starts: {format(new Date(benefit.starts_at), "MMM d, yyyy h:mm a")}</span>
                          </div>
                        )}
                        {benefit.expires_at && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Expires: {format(new Date(benefit.expires_at), "MMM d, yyyy h:mm a")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="px-4 py-3 bg-gray-50 border-t">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Created {format(new Date(benefit.created_at), "MMM d, yyyy")}
                      </span>
                      <Badge variant={benefit.is_active ? "success" : "secondary"} className="text-xs">
                        {benefit.is_active ? (
                          <>
                            <Check className="h-3 w-3 mr-1" /> Active
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" /> Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Benefit Preview</CardTitle>
          <CardDescription>Preview how collectors will see the benefit</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProduct && benefitTypes.length > 0 ? (
            <BenefitPreview
              benefit={formData}
              benefitType={benefitTypes.find((type) => type.id === Number(formData.benefitTypeId))}
            />
          ) : (
            <p className="text-muted-foreground">Select a product and benefit type to see a preview.</p>
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
                Collector benefits are additional value you provide to your customers who purchase your limited edition
                products. Similar to how Patreon and Verisart work, these benefits can increase the value of your
                editions and build collector loyalty.
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
    </div>
  )
}

// Add this preview dialog after the main dialog
