import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { CART_EDITION_HOLD_SESSION_COOKIE } from '@/lib/shop/cart-edition-hold-config'

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30

export async function getCartEditionHoldSessionUserId(
  cookieStore: ReturnType<typeof cookies>
): Promise<string | null> {
  const supabase = createRouteClient(cookieStore)
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session?.user?.id) return null
  return session.user.id
}

export function holderKeyForUserId(userId: string): string {
  return `user:${userId}`
}

export function holderKeyForAnonymousSession(sessionId: string): string {
  return `anon:${sessionId}`
}

/** Resolve holder key from auth session or anonymous cookie. */
export async function resolveCartEditionHoldHolderKey(
  cookieStore: ReturnType<typeof cookies>
): Promise<{ holderKey: string; setAnonymousSessionId?: string }> {
  const userId = await getCartEditionHoldSessionUserId(cookieStore)
  if (userId) {
    return { holderKey: holderKeyForUserId(userId) }
  }

  const existing = cookieStore.get(CART_EDITION_HOLD_SESSION_COOKIE)?.value?.trim()
  if (existing) {
    return { holderKey: holderKeyForAnonymousSession(existing) }
  }

  const sessionId = randomUUID()
  return {
    holderKey: holderKeyForAnonymousSession(sessionId),
    setAnonymousSessionId: sessionId,
  }
}

export function applyAnonymousHoldSessionCookie(
  response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
  sessionId: string
) {
  response.cookies.set(CART_EDITION_HOLD_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

export function readAnonymousHoldSessionFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CART_EDITION_HOLD_SESSION_COOKIE)?.value?.trim() || null
}
