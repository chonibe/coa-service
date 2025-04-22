"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Order {
  id: string
  order_number: number
  processed_at: string
  fulfillment_status: string
  financial_status: string
  line_items: any[]
}

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // In a real implementation, this would fetch from your API
        // For demo purposes, we'll use mock data
        const mockData = {
          id: orderId,
          order_number: 1001,
          processed_at: new Date().toISOString(),
          fulfillment_status: "fulfilled",
          financial_status: "paid",
          line_items: [
            {
              id: "item_1",
              title: "Limited Edition Print",
              quantity: 1,
              price: "150.00",
              total: "150.00",
              vendor: "Art Gallery",
            },
            {
              id: "item_2",
              title: "Collector's Edition Book",
              quantity: 1,
              price: "75.00",
              total: "75.00",
              vendor: "Book Publishers",
            },
          ],
        }

        setOrder(mockData)
      } catch (err: any) {
        console.error("Error fetching order details:", err)
        setError(err.message || "Failed to load order details")
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div>
        <Link href="/vendor/dashboard" className="flex items-center text-sm mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <p className="text-muted-foreground mt-2">View details for order #{orderId}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>Details about this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Order Number:</strong> {order.order_number}
                </p>
                <p>
                  <strong>Processed At:</strong> {new Date(order.processed_at).toLocaleString()}
                </p>
                <p>
                  <strong>Fulfillment Status:</strong> {order.fulfillment_status}
                </p>
                <p>
                  <strong>Financial Status:</strong> {order.financial_status}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Items included in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>${item.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Order Not Found</AlertTitle>
          <AlertDescription>Could not find order with ID {orderId}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
