"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package } from "lucide-react"

interface LineItem {
  id: string
  productName: string
  orderNumber: string
  quantity: number
}

interface SelectItemProps {
  selectedItemId?: string
  onSelect: (id: string, item: LineItem) => void
}

export function SelectItem({ selectedItemId, onSelect }: SelectItemProps) {
  const [items, setItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  // Fetch unpaired items on component mount
  useEffect(() => {
    fetchUnpairedItems()
  }, [])

  const fetchUnpairedItems = async () => {
    try {
      const response = await fetch("/api/nfc-tags/pair/unpaired-items")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch unpaired items")
      }

      setItems(data.items)
    } catch (err) {
      console.error("Error fetching unpaired items:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch unpaired items. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Items Available</p>
            <p className="text-sm text-muted-foreground mt-2">
              There are no unpaired items available at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Select Item to Pair</h3>
            <p className="text-sm text-muted-foreground">
              Choose an item from the list below to pair with an NFC tag.
            </p>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id, item)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedItemId === item.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Package className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Order: {item.orderNumber} • Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 