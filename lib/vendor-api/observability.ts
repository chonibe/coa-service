// Vendor API error observability helper — Phase 5.6
//
// Wraps the console.error + NextResponse.json pattern used across
// app/api/vendor/** so we have a single chokepoint we can later route
// to Sentry / PostHog / Better Stack without touching every handler.
//
// Zero runtime dependencies: by default it logs to console with a
// structured prefix. If globalThis.__vendorErrorSink__ exists (set by
// an instrumentation bootstrap file), we forward there too.
//
// Usage:
//
//   import { vendorApiError } from "@/lib/vendor-api/observability"
//
//   catch (error: any) {
//     return vendorApiError("payouts.cancel", error, {
//       vendorName,
//       payoutId,
//     })
//   }

import { NextResponse } from "next/server"

interface ErrorSink {
  (payload: {
    scope: string
    message: string
    stack?: string
    context?: Record<string, unknown>
    timestamp: string
  }): void
}

declare global {
   
  var __vendorErrorSink__: ErrorSink | undefined
}

function forwardToSink(payload: Parameters<ErrorSink>[0]) {
  try {
    globalThis.__vendorErrorSink__?.(payload)
  } catch (sinkErr) {
    // Never let a misbehaving sink break the original error flow.
     
    console.warn("[vendorApi] error sink threw:", sinkErr)
  }
}

export interface VendorApiErrorOptions {
  status?: number
  userMessage?: string
  context?: Record<string, unknown>
}

/**
 * Logs the error in a structured way and returns a NextResponse. The
 * returned response deliberately avoids leaking raw error messages or
 * stack traces to clients — artists see a short userMessage while ops
 * see the full detail in logs + sink.
 */
export function vendorApiError(
  scope: string,
  error: unknown,
  options: VendorApiErrorOptions = {},
): NextResponse {
  const status = options.status ?? 500
  const userMessage = options.userMessage ?? "Something went wrong. Please retry."
  const err = error instanceof Error ? error : new Error(String(error))

  const payload = {
    scope,
    message: err.message,
    stack: err.stack,
    context: options.context,
    timestamp: new Date().toISOString(),
  }

   
  console.error(`[vendorApi:${scope}]`, err.message, options.context || {})
  forwardToSink(payload)

  return NextResponse.json(
    {
      error: userMessage,
      // Keep a short scope tag in the response so on-call can grep logs
      // when an artist sends a screenshot. Full stack stays server-side.
      scope,
    },
    { status },
  )
}

/**
 * Lightweight structured logger for info/warn events on vendor APIs.
 * Mirrors the sink plumbing so we can later fan events out to PostHog.
 */
export function vendorApiLog(
  scope: string,
  message: string,
  context?: Record<string, unknown>,
) {
   
  console.log(`[vendorApi:${scope}]`, message, context || {})
  forwardToSink({
    scope,
    message,
    context,
    timestamp: new Date().toISOString(),
  })
}
