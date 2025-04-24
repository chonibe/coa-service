"use client"

import { Button } from "@/components/ui/button"
import { MoreVertical, CircleCheck, CircleAlert, BadgeIcon as Certificate } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { OrderItem } from "../order-lookup"

interface CollectionListItemProps {
  item: OrderItem
  onRemoveClick: (item: OrderItem) => void
}

export function CollectionListItem({ item, onRemoveClick }: CollectionListItemProps) {
  // Format acquisition date
  const acquisitionDate = new Date(item.order_info.processed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  // Determine if the item is verified (has edition info from database)
  const isVerified = item.editionInfo?.source === "supabase"

  return (
    <div className="flex flex-col sm:flex-row border rounded-lg overflow-hidden bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-all">
      {/* Artwork thumbnail */}
      <div className="relative w-full sm:w-48 h-48 bg-gray-100 dark:bg-gray-900">
        <img
          alt={item.title || "Artwork"}
          className="h-full w-full object-cover"
          src={item.image || "/placeholder.svg?height=400&width=400&query=abstract art"}
        />

        {/* Verification badge */}
        <div
          className={`absolute top-2 right-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
            isVerified ? "border-transparent bg-primary text-primary-foreground" : "text-foreground"
          } flex items-center gap-1 backdrop-blur-sm`}
        >
          {isVerified ? (
            <>
              <CircleCheck className="h-3 w-3" /> Verified
            </>
          ) : (
            <>
              <CircleAlert className="h-3 w-3" /> Unverified
            </>
          )}
        </div>
      </div>

      {/* Item details */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{item.title || `Product ${item.product_id}`}</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">by {item.vendor || "Unknown Artist"}</p>

            {/* Edition info */}
            {item.editionInfo?.number && item.editionInfo?.total && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Edition {item.editionInfo.number} of {item.editionInfo.total}
              </p>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Acquired: {acquisitionDate}</p>

            {/* Order info */}
            <p className="text-xs text-gray-500 dark:text-gray-400">Order #{item.order_info.order_number}</p>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(`/certificate/${item.line_item_id}`, "_blank")}>
                <Certificate size={16} className="mr-2" />
                View Certificate
              </DropdownMenuItem>
              {item.status !== "removed" && (
                <DropdownMenuItem onClick={() => onRemoveClick(item)} className="text-destructive">
                  Remove Item
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-auto pt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/certificate/${item.line_item_id}`, "_blank")}
          >
            View Certificate
          </Button>
        </div>
      </div>
    </div>
  )
}
