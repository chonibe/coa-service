"use client"

import Link from "next/link"
import { ArrowRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui"

/**
 * /vendor/legacy — AppShell-disabled fallback landing page.
 *
 * Used when NEXT_PUBLIC_APP_SHELL_ENABLED === 'false'. Directs artists back
 * to the unified AppShell home or, if they explicitly need v1, into the
 * still-live /vendor/dashboard route.
 *
 * This page is intentionally minimal — we don't want to rebuild a second home
 * view; we just want a graceful escape hatch that doesn't leak collectors or
 * artists into a half-retired surface.
 */
export default function VendorLegacyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#faf9f7]">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl text-[#1a1a1a]">
            The studio has moved
          </h1>
          <p className="font-body text-sm text-[#1a1a1a]/70">
            We&apos;ve rebuilt the artist experience around a single home.
            Head to your new home to manage artworks, series, media and
            payouts.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/vendor/home">
              Open the new home
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/vendor/dashboard" prefetch={false}>
              Continue to the legacy dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
