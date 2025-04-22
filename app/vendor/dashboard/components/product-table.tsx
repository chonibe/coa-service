"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Package } from "lucide-react"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

interface Product {
  id: string
  title: string
  image: string | null
  price: string
  currency: string
  inventory: number
}

interface ProductTableProps {
  vendorName: string
}

export function ProductTable({ vendorName }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Build the GraphQL query to fetch products for this vendor
        const graphqlQuery = `
          {
            products(
              first: 250
              query: "vendor:${vendorName}"
            ) {
              edges {
                node {
                  id
                  title
                  handle
                  vendor
                  productType
                  totalInventory
                  priceRangeV2 {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                    maxVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        `

        // Make the request to Shopify
        const response = await shopifyFetch("graphql.json", {
          method: "POST",
          body: JSON.stringify({ query: graphqlQuery }),
        })

        const data = await safeJsonParse(response)

        if (!data || !data.data || !data.data.products) {
          console.error("Invalid response from Shopify GraphQL API:", data)
          throw new Error("Invalid response from Shopify GraphQL API")
        }

        // Extract products
        const products = data.data.products.edges.map((edge: any) => {
          const product = edge.node

          // Extract the first image if available
          const image = product.images.edges.length > 0 ? product.images.edges[0].node.url : null

          return {
            id: product.id.split("/").pop(),
            title: product.title,
            handle: product.handle,
            vendor: product.vendor,
            productType: product.productType,
            inventory: product.totalInventory,
            price: product.priceRangeV2.minVariantPrice.amount,
            currency: product.priceRangeV2.minVariantPrice.currencyCode,
            image,
          }
        })

        setProducts(products)
      } catch (err: any) {
        console.error("Error fetching products:", err)
        setError(err.message || "Failed to load products")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [vendorName])

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
                    {product.price} {product.currency}
                  </TableCell>
                  <TableCell>{product.inventory}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
