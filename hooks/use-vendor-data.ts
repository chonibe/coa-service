"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseVendorDataOptions<T> {
  endpoint: string
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  refreshDependencies?: any[]
}

export function useVendorData<T>({
  endpoint,
  initialData,
  onSuccess,
  onError,
  refreshDependencies = [],
}: UseVendorDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchData = useCallback(
    async (showToast = false) => {
      try {
        const controller = new AbortController()
        const signal = controller.signal

        setIsLoading((prev) => !isRefreshing && prev)
        setIsRefreshing((prev) => showToast || prev)

        const response = await fetch(endpoint, { signal })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API error (${response.status}): ${errorText}`)
        }

        const result = await response.json()
        setData(result)
        setError(null)

        if (onSuccess) {
          onSuccess(result)
        }

        if (showToast) {
          toast({
            title: "Data Refreshed",
            description: "Your data has been updated successfully.",
          })
        }

        return result
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, don't update state
          return
        }

        console.error(`Error fetching data from ${endpoint}:`, err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load data"
        setError(errorMessage)

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage))
        }

        if (showToast) {
          toast({
            title: "Refresh Failed",
            description: "There was a problem refreshing your data.",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [endpoint, onSuccess, onError, toast, isRefreshing, ...refreshDependencies],
  )

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()

    return () => {
      // This would be where we'd abort the fetch if we were using AbortController
    }
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    isRefreshing,
    refresh,
  }
}
