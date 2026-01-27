"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AssignEditionNumbersButton, RevokeEditionButton } from "./AssignEditionNumbersButton"
import ProductDetails from "./ProductDetails"
import type { LineItem } from "@/types"

export function ProductEditionsClient({ productId }: { productId: string }) {
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLineItems = async () => {
    try {
      const response = await fetch(`/api/editions/get-by-line-item?productId=${productId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch line items")
      }
      const data = await response.json()
      setLineItems(data || [])
    } catch (error) {
      toast.error("Failed to fetch line items")
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLineItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleSuccess = () => {
    fetchLineItems()
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Editions</h1>
        <AssignEditionNumbersButton productId={productId} onSuccess={handleSuccess} />
      </div>
      <ProductDetails lineItems={lineItems} productId={productId} />
      <div className="grid gap-4">
        {lineItems.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center">
            <div>
              <p>Order ID: {item.order_id}</p>
              <p>Created: {new Date(item.created_at).toLocaleString()}</p>
              <p>Edition: {item.edition_number || "Not assigned"}</p>
              {item.edition_total && <p>Total Editions: {item.edition_total}</p>}
            </div>
            {item.edition_number && (
              <RevokeEditionButton lineItemId={item.id} onSuccess={handleSuccess} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

