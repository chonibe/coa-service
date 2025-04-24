"use client"

import { useState } from "react"
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

interface CollectionCardProps {
  item: OrderItem
  onRemoveClick: (item: OrderItem) => void
}

export function CollectionCard({ item, onRemoveClick }: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Format acquisition date
  const acquisitionDate = new Date(item.order_info.processed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  })

  // Determine if the item is verified (has edition info from database)
  const isVerified = item.editionInfo?.source === "supabase"

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950 flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-[4/3]">
        <div className="h-full w-full">
          <img
            alt={item.title || "Artwork"}
            className="h-full w-full object-cover"
            src={item.image || "/placeholder.svg?height=400&width=400&query=abstract art"}
          />
        </div>

        {/* Verification badge */}
        <div
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isVerified ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" : "text-foreground"
          } absolute right-2 top-2 z-10 flex items-center gap-1 backdrop-blur-sm`}
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

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(`/certificate/${item.line_item_id}`, "_blank")}
          >
            View Certificate
          </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-medium line-clamp-1 text-base">{item.title || `Product ${item.product_id}`}</h3>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
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
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">by {item.vendor || "Unknown Artist"}</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            {item.editionInfo?.number && item.editionInfo?.total && (
              <>
                <span className="whitespace-nowrap">Edition {item.editionInfo.number}</span>
                <span>of</span>
                <span>{item.editionInfo.total}</span>
                <span className="mx-1">•</span>
              </>
            )}
            <span className="hidden sm:inline">Acquired</span>
            <span className="whitespace-nowrap">{acquisitionDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
