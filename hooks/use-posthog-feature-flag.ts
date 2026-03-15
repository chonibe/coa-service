'use client'

/**
 * usePostHogFeatureFlag — client-side wrapper around posthog.isFeatureEnabled.
 *
 * Returns the flag value (boolean | string | null) once PostHog has loaded.
 * Tracks an exposure event on the first evaluation so flag usage is visible in PostHog.
 *
 * Usage:
 *   const variant = usePostHogFeatureFlag('experience_onboarding_variant')
 *   // variant === null while loading, 'control' | 'test' | true/false once resolved
 */

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export type FlagValue = boolean | string | null

export function usePostHogFeatureFlag(flagKey: string): FlagValue {
  const [value, setValue] = useState<FlagValue>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const resolve = () => {
      const raw = posthog.getFeatureFlag(flagKey)
      const resolved: FlagValue =
        raw === undefined ? null : typeof raw === 'boolean' || typeof raw === 'string' ? raw : null
      setValue(resolved)

      // Track exposure so PostHog can chart flag usage
      if (resolved !== null) {
        posthog.capture('$feature_flag_called', {
          $feature_flag: flagKey,
          $feature_flag_response: resolved,
        })
      }
    }

    // PostHog may not be fully loaded yet — use onFeatureFlags callback
    posthog.onFeatureFlags(resolve)

    // Also resolve immediately if flags are already available
    resolve()
  }, [flagKey])

  return value
}

/**
 * usePostHogFeatureFlagEnabled — convenience wrapper that returns a boolean.
 * Returns null while loading, true/false once the flag is resolved.
 */
export function usePostHogFeatureFlagEnabled(flagKey: string): boolean | null {
  const value = usePostHogFeatureFlag(flagKey)
  if (value === null) return null
  return Boolean(value)
}
