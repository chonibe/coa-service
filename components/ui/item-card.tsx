"use client"
import { Card } from "@/components/ui/card"
import { MoreVertical, Check, X, ImageIcon, RefreshCcw, BadgeIcon as Certificate } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useEditionInfo } from "@/hooks/use-edition-info"
import Image from "next/image"

interface OrderItem {
  id: string
  line_item_id: string
  product_id: string
  title: string
  quantity: number
  price: string
  total: string
  vendor: string
  image?: string
  imageAlt?: string
  tags: string[]
  fulfillable: boolean
  refunded: boolean
  restocked: boolean
  removed?: boolean
  inventory_quantity?: number
  is_limited_edition?: boolean
  total_inventory?: string
  rarity?: string
  commitment_number?: string
  status?: "active" | "removed"
  removed_reason?: string
  variant?: {
    position: number
  }
  order_info: {
    order_id: string
    order_number: string
    processed_at: string
    fulfillment_status: string
    financial_status: string
  }
  customAttributes?: any[]
  properties?: any[]
}

interface ItemCardProps {
  item: OrderItem
  formatMoney: (amount: string | number, currency?: string) => string
  formatStatus: (status: string) => string
  onRemoveClick: (item: OrderItem) => void
}

export function ItemCard({ item, formatMoney, formatStatus, onRemoveClick }: ItemCardProps) {
  const { editionInfo, isLoading, refreshEditionInfo } = useEditionInfo(item)

  const orderDate = new Date(item.order_info.processed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const isFulfillable = item.fulfillable !== false
  let nonFulfillableReason = ""

  if (!isFulfillable) {
    if (item.refunded) nonFulfillableReason = "Refunded"
    else if (item.restocked) nonFulfillableReason = "Restocked"
    else if (item.status === "removed") nonFulfillableReason = "Removed"
    else nonFulfillableReason = "Not Fulfillable"
  }

  return (
    <Card className={`overflow-hidden ${!isFulfillable ? "opacity-80" : ""}`}>
      {/* Item image */}
      <div className="relative h-60 bg-muted">
        {!isFulfillable && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-destructive/90 text-white px-3 py-1 font-semibold text-sm uppercase tracking-wider rounded z-10">
            {nonFulfillableReason}
          </div>
        )}

        {/* Edition badge */}
        {editionInfo && (
          <div
            className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium bg-background/90 z-10 
${
  editionInfo.source === "supabase"
    ? "text-green-600 border border-green-300"
    : editionInfo.source === "sequential_uuid"
      ? "text-primary border border-primary/30"
      : "text-primary"
}`}
          >
            {editionInfo.total && editionInfo.number ? (
              <span>
                #{editionInfo.number}/{editionInfo.total} Edition
                {editionInfo.source === "supabase"
                  ? " ✓✓✓"
                  : editionInfo.source === "sequential_uuid"
                    ? " ✓✓"
                    : editionInfo.source === "sequential_order"
                      ? " ✓"
                      : " *"}
              </span>
            ) : item.is_limited_edition ? (
              <span>Limited Edition</span>
            ) : (
              <span>Open Edition</span>
            )}
          </div>
        )}

        {/* Inventory status */}
        {item.inventory_quantity !== undefined && (
          <div
            className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium bg-background/90 z-10
           ${item.inventory_quantity > 0 ? "text-green-600" : "text-destructive"}`}
          >
            {item.inventory_quantity > 0 ? `${item.inventory_quantity} available` : "Sold out"}
          </div>
        )}

        {/* Actions menu */}
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => refreshEditionInfo()}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh Edition Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/certificate/${item.line_item_id}`, "_blank")}>
                <Certificate className="h-4 w-4 mr-2" />
                View Certificate
              </DropdownMenuItem>
              {item.status !== "removed" && (
                <DropdownMenuItem onClick={() => onRemoveClick(item)} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Remove Item
                </DropdownMenuItem>
              )}
              {item.status === "removed" && (
                <DropdownMenuItem className="text-muted-foreground cursor-not-allowed opacity-50">
                  <Check className="h-4 w-4 mr-2" />
                  Item Removed
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {item.image ? (
          <Image
            src={item.image || "/placeholder.svg"}
            alt={item.imageAlt || item.title}
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon size={40} />
          </div>
        )}
      </div>

      {/* Item content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
        <div className="text-sm text-muted-foreground mb-4 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5"></span>
          {item.vendor}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price:</span>
            <span>{formatMoney(item.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity:</span>
            <span>{item.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span>{formatMoney(item.total)}</span>
          </div>

          {/* Edition info */}
          {editionInfo && (
            <div className="bg-muted p-2 rounded mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edition:</span>
                <span>
                  {editionInfo.total && editionInfo.number
                    ? `#${editionInfo.number} of ${editionInfo.total} (Limited)`
                    : editionInfo.total && item.is_limited_edition
                      ? `Limited Edition of ${editionInfo.total}`
                      : item.is_limited_edition
                        ? "Limited Edition"
                        : "Open Edition"}
                  {editionInfo.source === "supabase"
                    ? " ✓✓✓"
                    : editionInfo.source === "sequential_uuid"
                      ? " ✓✓"
                      : editionInfo.source === "sequential_order"
                        ? " ✓"
                        : ""}
                </span>
              </div>
              {editionInfo.source === "supabase" && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  {editionInfo.status === "removed"
                    ? "This item has been marked as removed"
                    : "Verified edition number from database"}
                  {editionInfo.updated_at && ` (Updated: ${new Date(editionInfo.updated_at).toLocaleDateString()})`}
                </div>
              )}
              {editionInfo.source === "sequential_uuid" && (
                <div className="text-xs text-primary font-medium mt-1">Guaranteed sequential number with UUID</div>
              )}
              {editionInfo.source === "sequential_order" && (
                <div className="text-xs text-green-600 mt-1">Accurate edition number based on order date</div>
              )}
              {(editionInfo.source === "order_sequence" || editionInfo.source === "random") && editionInfo.note && (
                <div className="text-xs text-muted-foreground italic mt-1">{editionInfo.note}</div>
              )}
              {editionInfo.note && editionInfo.source === "supabase" && (
                <div className="text-xs text-muted-foreground italic mt-1">{editionInfo.note}</div>
              )}
            </div>
          )}

          {/* Removal reason if item is removed */}
          {(item.status === "removed" || editionInfo?.status === "removed") && (
            <div className="bg-destructive/10 p-2 rounded mt-2">
              <div className="flex justify-between">
                <span className="text-destructive font-medium">Status:</span>
                <span className="text-destructive font-medium">Removed</span>
              </div>
              {(item.removed_reason || editionInfo?.removed_reason) && (
                <div className="text-xs text-destructive/80 mt-1">
                  Reason: {item.removed_reason || editionInfo?.removed_reason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-block px-2 py-0.5 bg-muted text-xs rounded-full text-primary">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Order info */}
      <div className="p-4 bg-muted border-t">
        <div className="flex items-center text-primary font-medium mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
          Order #{item.order_info.order_number}
        </div>
        <div className="text-xs text-muted-foreground mb-2">{orderDate}</div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${
              item.order_info.fulfillment_status === "fulfilled"
                ? "bg-green-100 text-green-800"
                : item.order_info.fulfillment_status === "partially_fulfilled"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 
            ${
              item.order_info.fulfillment_status === "fulfilled"
                ? "bg-green-800"
                : item.order_info.fulfillment_status === "partially_fulfilled"
                  ? "bg-blue-800"
                  : "bg-amber-800"
            }`}
            ></span>
            {formatStatus(item.order_info.fulfillment_status)}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${
              item.order_info.financial_status === "paid"
                ? "bg-green-100 text-green-800"
                : item.order_info.financial_status === "refunded"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 
            ${
              item.order_info.financial_status === "paid"
                ? "bg-green-800"
                : item.order_info.financial_status === "refunded"
                  ? "bg-red-800"
                  : "bg-gray-800"
            }`}
            ></span>
            {formatStatus(item.order_info.financial_status)}
          </span>
        </div>
      </div>
    </Card>
  )
}
