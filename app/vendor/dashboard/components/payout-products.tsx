"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Package, DollarSign, Percent } from "lucide-react"

interface Product {
  id: string
  title: string
  image: string | null
  price: string
  currency: string
  payout_amount: number
  is_percentage: boolean
}

interface PayoutProductsProps {
  vendorName: string
}

export function PayoutProducts({ vendorName }: PayoutProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/vendors/products?vendor=${encodeURIComponent(vendorName)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = await response.json()
        setProducts(data.products || [])
      } catch (err: any) {
        console.error("Error fetching products:", err)
        setError(err.message || "Failed to load products")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [vendorName])

  const formatMoney = (amount: string | number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(Number(amount))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Products</CardTitle>
        <CardDescription>Products and their payout amounts</CardDescription>
      </CardHeader>
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
                <TableHead>Payout Amount</TableHead>
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
                  <TableCell>{formatMoney(product.price, product.currency)}</TableCell>
                  <TableCell>
                    {product.is_percentage ? (
                      <>
                        {product.payout_amount}% <Percent className="inline-block h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        {formatMoney(product.payout_amount, product.currency)}{" "}
                        <DollarSign className="inline-block h-4 w-4 ml-1" />
                      </>
                    )}
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
