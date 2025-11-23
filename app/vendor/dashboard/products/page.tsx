"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ProductTable } from "../components/product-table"
import { useVendorData } from "@/hooks/use-vendor-data"
import { Plus, Package, CheckCircle, DollarSign, Clock, XCircle } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  const { products, isLoading, error } = useVendorData()
  const [totalProducts, setTotalProducts] = useState(0)
  const [activeProducts, setActiveProducts] = useState(0)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)

  useEffect(() => {
    if (products) {
      setTotalProducts(products.length)
      setActiveProducts(products.filter((p) => p.status === "active").length)
    }
  }, [products])

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/vendor/products/submissions", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setSubmissions(data.submissions || [])
        }
      } catch (err) {
        console.error("Error fetching submissions:", err)
      } finally {
        setLoadingSubmissions(false)
      }
    }

    fetchSubmissions()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      case "published":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Published
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load product data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and view performance metrics</p>
        </div>
        <Button onClick={() => router.push("/vendor/dashboard/products/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{totalProducts}</div>}
          </CardContent>
        </Card>

        <Card className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{activeProducts}</div>}
          </CardContent>
        </Card>

        <Card className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                $
                {products && products.length > 0
                  ? (products.reduce((sum, p) => sum + (Number.parseFloat(p.price) || 0), 0) / products.length).toFixed(
                      2,
                    )
                  : "0.00"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions
            {submissions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {submissions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <Card className="overflow-hidden w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>View and manage all your products</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : (
                <ProductTable products={products || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <Card className="overflow-hidden w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Product Submissions</CardTitle>
              <CardDescription>
                View the status of products you've submitted for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No product submissions yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/vendor/dashboard/products/create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/vendor/dashboard/products/submissions/${submission.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">
                              {(submission.product_data as any)?.title || "Untitled Product"}
                            </h3>
                            {getStatusBadge(submission.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                          {submission.rejection_reason && (
                            <p className="text-sm text-destructive mt-2">
                              {submission.rejection_reason}
                            </p>
                          )}
                          {submission.admin_notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Admin notes: {submission.admin_notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {submission.shopify_product_id && (
                            <div>Published to Shopify</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
