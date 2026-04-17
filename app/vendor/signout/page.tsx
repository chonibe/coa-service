"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { clearCachedVendorName } from "@/hooks/use-vendor-name"

export default function VendorSignoutPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function signOut() {
      try {
        await fetch("/api/vendor/logout", {
          method: "POST",
          credentials: "include",
        })
      } catch (error) {
        console.error("[vendor/signout] Logout request failed", error)
      } finally {
        try {
          clearCachedVendorName()
        } catch {
          // ignore storage failures
        }
        if (!cancelled) {
          router.replace("/login")
        }
      }
    }

    signOut()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-[#1a1a1a]/70">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="font-body text-sm">Signing you out…</p>
      </div>
    </main>
  )
}
