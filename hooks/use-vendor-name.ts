"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "sc:vendorName"

interface VendorNameState {
  vendorName: string | null
  loading: boolean
  error: Error | null
}

/**
 * Resolves the current vendor's display name by hitting `/api/vendor/profile`
 * once per session. Result is cached in sessionStorage so legacy APIs that still
 * require `?vendorName=` don't cause repeated round-trips.
 *
 * Prefer server-resolved vendor context where possible; this hook exists to
 * bridge legacy client calls.
 */
export function useVendorName(): VendorNameState {
  const [state, setState] = useState<VendorNameState>(() => {
    if (typeof window === "undefined") {
      return { vendorName: null, loading: true, error: null }
    }
    const cached = window.sessionStorage.getItem(STORAGE_KEY)
    return {
      vendorName: cached,
      loading: !cached,
      error: null,
    }
  })

  useEffect(() => {
    if (state.vendorName) return
    let cancelled = false

    async function fetchProfile() {
      try {
        const res = await fetch("/api/vendor/profile", { credentials: "include" })
        if (!res.ok) {
          throw new Error(`Profile fetch failed: ${res.status}`)
        }
        const data = await res.json()
        const name = data?.vendor?.vendor_name ?? null
        if (name && typeof window !== "undefined") {
          window.sessionStorage.setItem(STORAGE_KEY, name)
        }
        if (!cancelled) {
          setState({ vendorName: name, loading: false, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            vendorName: prev.vendorName,
            loading: false,
            error: error instanceof Error ? error : new Error("Unknown error"),
          }))
        }
      }
    }

    fetchProfile()

    return () => {
      cancelled = true
    }
  }, [state.vendorName])

  return state
}

/**
 * Clears the cached vendor name (call on logout to avoid cross-session leakage).
 */
export function clearCachedVendorName() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(STORAGE_KEY)
}
