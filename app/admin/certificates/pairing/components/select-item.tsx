"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface LineItem {
  id: string
  productName: string
  orderNumber: string
  quantity: number
}

interface SelectItemProps {
  onSelect: (itemId: string) => void
  selectedItemId?: string
}

export function SelectItem({ onSelect, selectedItemId }: SelectItemProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<LineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/nfc-tags/pair/unpaired-items")
        if (!response.ok) {
          throw new Error("Failed to fetch items")
        }
        const data = await response.json()
        setItems(data)
      } catch (err) {
        setError("Failed to load unpaired items. Please try again.")
        console.error("Error fetching items:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  const filteredItems = items.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading items...</p>
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
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No unpaired items found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Items</Label>
            <Input
              id="search"
              placeholder="Search by product name or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <RadioGroup
              value={selectedItemId}
              onValueChange={onSelect}
              className="space-y-2"
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 rounded-lg border p-4"
                >
                  <RadioGroupItem value={item.id} id={item.id} />
                  <Label
                    htmlFor={item.id}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      Order: {item.orderNumber} • Quantity: {item.quantity}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
} 