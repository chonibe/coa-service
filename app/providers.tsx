"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { ShopAuthProvider, useShopAuthContext } from "@/lib/shop/ShopAuthContext"

// Conditionally import React Query to avoid build errors if not installed
let QueryClientProvider: any = null
let ReactQueryDevtools: any = null
let QueryClient: any = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dependency
  const reactQuery = require("@tanstack/react-query")
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dependency
  const reactQueryDevtools = require("@tanstack/react-query-devtools")
  QueryClientProvider = reactQuery.QueryClientProvider
  QueryClient = reactQuery.QueryClient
  ReactQueryDevtools = reactQueryDevtools.ReactQueryDevtools
} catch {
  // React Query not installed, will use pass-through
  console.warn("React Query not installed. Run: npm install @tanstack/react-query @tanstack/react-query-devtools")
}

/** Real PostHog keys are phc_ followed by 32+ chars. Placeholders like phc_your_project_api_key must be skipped. */
function isValidPostHogKey(key: string | undefined): key is string {
  return !!key && key.startsWith("phc_") && key.length > 40 && !key.includes("your_project")
}

/** PostHog: session replay, heatmaps, autocapture, user journeys. Key from window (runtime) or build-time env. */
function PostHogWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => {
    const key =
      (typeof window !== "undefined" && (window as unknown as { __POSTHOG_KEY__?: string }).__POSTHOG_KEY__) ||
      process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host =
      (typeof window !== "undefined" && (window as unknown as { __POSTHOG_HOST__?: string }).__POSTHOG_HOST__) ||
      process.env.NEXT_PUBLIC_POSTHOG_HOST ||
      "https://us.i.posthog.com"
    if (isValidPostHogKey(key)) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: false,
        person_profiles: "identified_only",
        disable_session_recording: false,
        session_recording: {
          recordCrossOriginIframes: false,
          console: false,
        },
        enable_heatmaps: true,
        defaults: "2026-01-30",
        autocapture: true,
        capture_pageleave: true,
        capture_dead_clicks: true,
        rageclick: true,
        advanced_disable_decide: true,
        __preview_remote_config: false,
      })
    }
  }, [])
  useEffect(() => {
    const key =
      (typeof window !== "undefined" && (window as unknown as { __POSTHOG_KEY__?: string }).__POSTHOG_KEY__) ||
      process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (pathname && isValidPostHogKey(key)) {
      posthog.capture("$pageview", {
        path: pathname,
        $current_url: typeof window !== "undefined" ? window.location.href : pathname,
        title: typeof document !== "undefined" ? document.title : undefined,
      })
    }
  }, [pathname])
  return <PHProvider client={posthog}>{children}</PHProvider>
}

/** Identify logged-in user in PostHog so journeys and funnels are tied to users. */
function PostHogIdentify() {
  const { user } = useShopAuthContext()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !user) return
    posthog.identify(user.id, {
      email: user.email,
      collector_identifier: user.collectorIdentifier,
      roles: user.roles,
      is_collector: user.isCollector,
      is_vendor: user.isVendor,
      is_admin: user.isAdmin,
      is_member: user.isMember,
      membership_tier: user.membershipTier,
    })
    posthog.group("user", user.id, {
      roles: user.roles.join(","),
      is_member: user.isMember,
    })
  }, [posthog, user])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      QueryClient
        ? new QueryClient({
            defaultOptions: {
              queries: {
                staleTime: 60 * 1000, // 1 minute
                refetchOnWindowFocus: false,
                retry: 1,
                refetchOnMount: true,
                refetchOnReconnect: true,
              },
              mutations: {
                retry: 1,
              },
            },
          })
        : null
  )

  const content = (
    <ShopAuthProvider>
      <PostHogIdentify />
      {children}
      {QueryClientProvider && queryClient && process.env.NODE_ENV === "development" && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </ShopAuthProvider>
  )

  if (QueryClientProvider && queryClient) {
    return (
      <PostHogWrapper>
        <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
      </PostHogWrapper>
    )
  }

  return <PostHogWrapper>{content}</PostHogWrapper>
}

