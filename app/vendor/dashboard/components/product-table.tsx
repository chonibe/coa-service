"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface Product {
  id: string
  title: string
  vendor: string
  price: number
  totalSold: number
  status: string
}

interface ProductTableProps {
  vendorName?: string
}

export function ProductTable({ vendorName }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentVendor, setCurrentVendor] = useState<string>(vendorName || "")

  useEffect(() => {
    const fetchVendorProducts = async () => {
      try {
        setLoading(true)

        // If vendorName is not provided, try to get it from the profile
        let vendor = vendorName
        if (!vendor) {
          const profileResponse = await fetch("/api/vendor/profile")
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            vendor = profileData.vendor?.vendor_name
            setCurrentVendor(vendor || "")
          }
        }

        if (!vendor) {
          throw new Error("Could not determine vendor name")
        }

        const response = await fetch(`/api/vendors/products?vendor=${encodeURIComponent(vendor)}`)
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = await response.json()
        setProducts(data.products || [])
        setError(null)
      } catch (err) {
        console.error("Error fetching vendor products:", err)
        setError("Failed to load products")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchVendorProducts()
  }, [vendorName])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found for {currentVendor}</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Sold</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-4 py-3">{product.title}</td>
                <td className="px-4 py-3">${product.price.toFixed(2)}</td>
                <td className="px-4 py-3">{product.totalSold}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                      product.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
