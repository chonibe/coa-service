import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { buildCollectorSessionCookie } from "@/lib/collector-session"
import { getUserActiveRoles } from "@/lib/rbac/role-helpers"

/**
 * Ensures collector profile and role exist for the current Supabase user.
 * Called after email OTP verification (signInWithOtp + verifyOtp) since
 * that flow does not go through the auth callback.
 */
export async function POST() {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const email = user.email?.toLowerCase() ?? null
  if (!email) {
    return NextResponse.json({ error: "No email on user" }, { status: 400 })
  }

  const userId = user.id
  const roles = await getUserActiveRoles(userId)

  if (roles.includes("collector")) {
    // Role already exists - just ensure collector_session cookie is set
    const response = NextResponse.json({ ok: true })
    const collectorCookie = buildCollectorSessionCookie({
      shopifyCustomerId: null,
      email,
      collectorIdentifier: null,
      impersonated: false,
      issuedAt: Date.now(),
    })
    response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
    return response
  }

  const serviceClient = createServiceClient()

  // Check for existing collector profile or orders
  const { data: orderMatch } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let profileMatch = null
  const { data: profileByEmail } = await serviceClient
    .from("collector_profiles")
    .select("id, shopify_customer_id")
    .eq("email", email)
    .maybeSingle()
  profileMatch = profileByEmail

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id

  if (!profileMatch && shopifyCustomerId) {
    const { data: profileByShopifyId } = await serviceClient
      .from("collector_profiles")
      .select("id, email")
      .eq("shopify_customer_id", shopifyCustomerId)
      .maybeSingle()
    if (profileByShopifyId) {
      profileMatch = profileByShopifyId
      await serviceClient
        .from("collector_profiles")
        .update({
          email,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileByShopifyId.id)
    }
  }

  // Ensure role exists for existing collector
  if (profileMatch || orderMatch) {
    await serviceClient
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: "collector",
          is_active: true,
          metadata: {
            source: "ensure_profile",
            migration_date: new Date().toISOString(),
            email,
          },
        },
        { onConflict: "user_id,role", ignoreDuplicates: false }
      )
  } else {
    // Create new collector profile
    const { error: profileCreateError } = await serviceClient
      .from("collector_profiles")
      .insert({
        user_id: userId,
        email,
        shopify_customer_id: shopifyCustomerId || null,
        signup_source: "email_otp",
        onboarding_step: 0,
      })

    if (profileCreateError) {
      console.error("[ensure-profile] Profile creation failed", profileCreateError)
      return NextResponse.json(
        { error: profileCreateError.message || "Failed to create profile" },
        { status: 500 }
      )
    }

    await serviceClient
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "collector",
        is_active: true,
        metadata: {
          source: "email_otp_signup",
          signup_date: new Date().toISOString(),
          email,
        },
      })

    // Non-critical: avatar, ledger, achievement
    await serviceClient
      .from("collector_avatars")
      .insert({ user_id: userId, equipped_items: {} })
      .then(() => {}, (err) => console.warn("[ensure-profile] Avatar failed", err))

    await serviceClient
      .from("collector_ledger_entries")
      .insert({
        collector_identifier: email,
        transaction_type: "signup_bonus",
        amount: 100,
        currency: "CREDITS",
        description: "Welcome to Street Collector! 🎉",
        created_by: "system",
        metadata: { signup: true, user_id: userId, source: "email_otp_signup" },
      })
      .then(() => {}, (err) => console.warn("[ensure-profile] Ledger failed", err))
  }

  const response = NextResponse.json({ ok: true })
  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId ? String(shopifyCustomerId) : null,
    email,
    collectorIdentifier: null,
    impersonated: false,
    issuedAt: Date.now(),
  })
  response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)

  return response
}
