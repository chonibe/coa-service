"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

interface SalesData {
  date: string
  sales: number
  revenue: number
}

interface SalesChartProps {
  vendorName: string
}

export function SalesChart({ vendorName }: SalesChartProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch products by vendor
        const productsData = await fetchProductsByVendor(vendorName)

        // Aggregate sales data for each product
        const salesDataPromises = productsData.products.map(async (product) => {
          const productSalesData = await fetchProductSalesFromShopify(product.id)
          return {
            productId: product.id,
            totalSales: productSalesData.totalSales,
            totalRevenue: productSalesData.totalRevenue,
          }
        })

        const salesResults = await Promise.all(salesDataPromises)

        // Transform the data to match the expected format
        const transformedData: SalesData[] = salesResults.map((item) => ({
          date: new Date().toISOString().substring(0, 10), // Use current date for simplicity
          sales: item.totalSales || 0,
          revenue: item.totalRevenue || 0,
        }))

        setSalesData(transformedData)
      } catch (err: any) {
        console.error("Error fetching sales data:", err)
        setError(err.message || "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
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
        ) : salesData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No sales data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Sales" />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

async function fetchProductsByVendor(vendorName: string) {
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
    const products = data.data.products.edges.map((edge: any) => edge.node)

    return { products }
  } catch (error) {
    console.error("Error fetching products by vendor:", error)
    throw error
  }
}

async function fetchProductSalesFromShopify(productId: string) {
  try {
    // Build the GraphQL query to fetch product sales data
    const graphqlQuery = `
      {
        product(id: "gid://shopify/Product/${productId}") {
          totalSales: totalInventory
        }
      }
    `

    // Make the request to Shopify
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })

    const data = await safeJsonParse(response)

    if (!data || !data.data || !data.data.product) {
      console.error("Invalid response from Shopify GraphQL API:", data)
      throw new Error("Invalid response from Shopify GraphQL API")
    }

    const product = data.data.product
    const totalSales = product.totalSales || 0
    const productPrice = 100 //product.priceRangeV2.minVariantPrice.amount || 0
    const totalRevenue = totalSales * productPrice

    return { totalSales, totalRevenue }
  } catch (error) {
    console.error("Error fetching product sales from Shopify:", error)
    return { totalSales: 0, totalRevenue: 0 }
  }
}
