import { useEffect, useRef, useState } from "react"

interface UsePollingOptions {
  interval?: number // Polling interval in milliseconds
  enabled?: boolean // Whether polling is enabled
  onError?: (error: Error) => void
}

/**
 * Custom hook for polling data at regular intervals
 * Useful for real-time updates without WebSocket
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchFn()
      if (isMountedRef.current) {
        setData(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      if (isMountedRef.current) {
        setError(error)
        onError?.(error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true

    // Initial fetch
    fetchData()

    // Set up polling interval
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, interval)
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval])

  const refetch = () => {
    fetchData()
  }

  return { data, isLoading, error, refetch }
}

