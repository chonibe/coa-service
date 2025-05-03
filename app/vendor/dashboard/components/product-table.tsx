"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Product {
  id: string
  title: string
  image: string | null
  price: string | number
  currency: string
  inventory?: number
  payout_amount?: number
  is_percentage?: boolean
}

interface ProductTableProps {
  vendorName?: string
}

export function ProductTable({ vendorName }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentVendor, setCurrentVendor] = useState<string | null>(null)

  // If vendorName is not provided, try to get it from the vendor profile
  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (vendorName) {
        setCurrentVendor(vendorName)
        return
      }

      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setCurrentVendor(data.vendor?.vendor_name || null)
        } else {
          throw new Error("Failed to fetch vendor profile")
        }
      } catch (err) {
        console.error("Error fetching vendor profile:", err)
        setError("Could not determine vendor name")
      }
    }

    fetchVendorProfile()
  }, [vendorName])

  // Fetch products when vendor name is available
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentVendor) return

      setIsLoading(true)
      setError(null)

      try {
        console.log(`Fetching products for vendor: ${currentVendor}`)
        const response = await fetch(`/api/vendors/products?vendor=${encodeURIComponent(currentVendor)}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }

        const data = await response.json()
        console.log(`Received ${data.products?.length || 0} products`)
        setProducts(data.products || [])
      } catch (err: any) {
        console.error("Error fetching products:", err)
        setError(err.message || "Failed to load products")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentVendor) {
      fetchProducts()
    }
  }, [currentVendor])

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No products found for this vendor.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.title}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeof product.price === "string" ? product.price : product.price.toFixed(2)} {product.currency}
                  </TableCell>
                  <TableCell>{product.inventory || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="link" size="sm">
                      <Link href={`/vendor/dashboard/benefits?product=${product.id}`}>
                        Manage Benefits
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
