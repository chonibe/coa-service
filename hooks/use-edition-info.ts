"use client"

import { useState, useEffect } from "react"
import { getEditionInfo } from "/dev/null-client"

export interface EditionInfo {
  number: string
  source: string
  total?: string
  note?: string
  updated_at?: string
  uuid?: string
  status?: "active" | "removed"
  removed_reason?: string
}

export function useEditionInfo(item: any): {
  editionInfo: EditionInfo | null
  isLoading: boolean
  error: string | null
  refreshEditionInfo: () => Promise<void>
} {
  const [editionInfo, setEditionInfo] = useState<EditionInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const determineEditionNumber = async () => {
    if (!item || !item.order_info) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Get edition info from our client helper
      const result = await getEditionInfo(item.order_info.order_id, item.line_item_id)

      if (result.success && result.data) {
        const data = result.data
        // Check if the item is marked as removed
        const isRemoved = data.status === "removed" || data.removed_reason

        setEditionInfo({
          number: data.edition_number ? data.edition_number.toString() : "N/A",
          source: "supabase",
          total: data.edition_total ? data.edition_total.toString() : undefined,
          note: isRemoved ? "This item has been marked as removed" : "Verified edition number",
          updated_at: data.updated_at,
          status: data.status || "active",
          removed_reason: data.removed_reason,
        })
        return
      }

      // Fallback to a random number if no data found
      const total = item.total_inventory ? Number.parseInt(item.total_inventory, 10) : 100
      const randomNum = Math.floor(Math.random() * total) + 1

      setEditionInfo({
        number: randomNum.toString(),
        source: "random",
        note: "Estimated position (fallback)",
        total: item.total_inventory,
      })
    } catch (err) {
      console.error("Error determining edition number:", err)
      setError("Failed to retrieve edition information")

      // Fallback to a random edition number
      const total = item.total_inventory ? Number.parseInt(item.total_inventory, 10) : 100
      const randomNum = Math.floor(Math.random() * total) + 1

      setEditionInfo({
        number: randomNum.toString(),
        source: "random",
        note: "Estimated position (fallback)",
        total: item.total_inventory,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    determineEditionNumber()
  }, [item])

  const refreshEditionInfo = async () => {
    await determineEditionNumber()
  }

  return { editionInfo, isLoading, error, refreshEditionInfo }
}
