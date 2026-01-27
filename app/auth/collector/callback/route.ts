import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { buildCollectorSessionCookie } from "@/lib/collector-session"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"
// import { sendCollectorWelcomeEmail } from "@/lib/notifications/collector-welcome" // Disabled for now

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  const finalRedirectBase = (appUrl || "").replace(/\/$/, "")
  const code = searchParams.get("code")
  const redirectParam = searchParams.get("redirect") || "/collector/dashboard"

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, finalRedirectBase || undefined))
  }

  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  let data: { session?: { user?: { email?: string } } } | null = null
  let exchangeError: unknown = null

  try {
    const result = await supabase.auth.exchangeCodeForSession(code)
    data = result.data
    exchangeError = result.error
  } catch (err) {
    exchangeError = err
    console.error("[collector-google-callback] exchange threw", err)
  }

  if (exchangeError || !data?.session?.user?.email) {
    console.error("[collector-google-callback] exchange failed", exchangeError)
    return NextResponse.redirect(new URL(`/login?error=oauth_failed`, finalRedirectBase || undefined))
  }

  const email = data.session!.user!.email!.toLowerCase()

  const serviceClient = createServiceClient()
  const { data: orderMatch, error: orderError } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (orderError) {
    console.error("[collector-google-callback] order lookup failed", orderError)
    return NextResponse.redirect(new URL(`/login?error=lookup_failed`, finalRedirectBase || undefined))
  }

  let profileMatch = null
  const { data: profileByEmail, error: profileError } = await serviceClient
    .from("collector_profiles")
    .select("id, shopify_customer_id")
    .eq("email", email)
    .maybeSingle()

  if (profileError) {
    console.error("[collector-google-callback] profile lookup failed", profileError)
  }

  profileMatch = profileByEmail

  const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id

  // Also check for profile by shopify_customer_id to prevent duplicates
  if (!profileMatch && shopifyCustomerId) {
    const { data: profileByShopifyId } = await serviceClient
      .from("collector_profiles")
      .select("id, email")
      .eq("shopify_customer_id", shopifyCustomerId)
      .maybeSingle()

    if (profileByShopifyId) {
      console.log(`[collector-google-callback] Found existing profile by Shopify ID: ${profileByShopifyId.email}`)
      profileMatch = profileByShopifyId
      
      // Update the profile with the new email/user_id if needed
      const userId = data.session!.user!.id
      await serviceClient
        .from("collector_profiles")
        .update({
          email: email,
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileByShopifyId.id)
    }
  }

  // If no existing order or profile, create new collector account
  if (!orderMatch && !profileMatch) {
    const userId = data.session!.user!.id
    
    console.log(`[collector-google-callback] Creating new collector account for: ${email}`)
    
    // 1. Create collector profile (with shopify_customer_id if available)
    const { data: newProfile, error: profileCreateError } = await serviceClient
      .from('collector_profiles')
      .insert({
        user_id: userId,
        email: email,
        shopify_customer_id: shopifyCustomerId || null,
        signup_source: 'oauth',
        onboarding_step: 0
      })
      .select()
      .single()
    
    if (profileCreateError) {
      console.error('[collector-google-callback] Profile creation failed', profileCreateError)
      return NextResponse.redirect(new URL(`/login?error=signup_failed`, finalRedirectBase || undefined))
    }
    
    // 2. Create collector role in RBAC system
    const { error: roleError } = await serviceClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'collector',
        is_active: true,
        metadata: {
          source: 'oauth_signup',
          signup_date: new Date().toISOString(),
          email: email
        }
      })
    
    if (roleError) {
      console.error('[collector-google-callback] Role creation failed', roleError)
      // Continue anyway - role might already exist
    }
    
    // 3. Initialize InkOGatchi avatar (non-critical, continue on error)
    const { error: avatarError } = await serviceClient
      .from('collector_avatars')
      .insert({
        user_id: userId,
        equipped_items: {} // Empty, will use defaults
      })
    
    if (avatarError) {
      console.warn('[collector-google-callback] Avatar creation failed (non-critical)', avatarError)
    }
    
    // 4. Ensure collector account exists for banking system
    try {
      await serviceClient.rpc('get_or_create_collector_account', {
        p_collector_identifier: email,
        p_account_type: 'customer'
      })
    } catch (accountError) {
      // Try direct insert if RPC doesn't exist
      await serviceClient
        .from('collector_accounts')
        .insert({
          collector_identifier: email,
          account_type: 'customer',
          account_status: 'active'
        })
        .select()
        .maybeSingle()
    }
    
    // 5. Award welcome credits (100 bonus)
    const { error: creditError } = await serviceClient
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: email,
        transaction_type: 'signup_bonus',
        amount: 100,
        currency: 'CREDITS',
        description: 'Welcome to Street Collector! 🎉',
        created_by: 'system',
        metadata: { 
          signup: true, 
          user_id: userId,
          source: 'oauth_signup'
        }
      })
    
    if (creditError) {
      console.warn('[collector-google-callback] Credit award failed (non-critical)', creditError)
    }
    
    // 6. Create "New Collector" achievement
    const { error: achievementError } = await serviceClient
      .from('collector_achievements')
      .insert({
        collector_email: email,
        user_id: userId,
        achievement_type: 'new_collector',
        achievement_title: 'Welcome Collector',
        achievement_description: 'Joined the Street Collector community'
      })
    
    if (achievementError) {
      console.warn('[collector-google-callback] Achievement creation failed (non-critical)', achievementError)
    }
    
    // 7. Send welcome email (DISABLED for now)
    // sendCollectorWelcomeEmail({
    //   email,
    //   name: data.session!.user!.user_metadata?.full_name || data.session!.user!.user_metadata?.name,
    //   creditsAmount: 100,
    // }).catch((emailError) => {
    //   console.warn('[collector-google-callback] Welcome email failed (non-critical)', emailError)
    // })
    
    console.log(`[collector-google-callback] New collector created successfully: ${email}`)
    
    // Redirect to onboarding wizard for new collectors
    const collectorCookie = buildCollectorSessionCookie({
      shopifyCustomerId: null,
      email,
      collectorIdentifier: null,
      impersonated: false,
      issuedAt: Date.now(),
    })
    
    const response = NextResponse.redirect(new URL('/collector/welcome', finalRedirectBase || undefined))
    response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
    response.cookies.set(REQUIRE_ACCOUNT_SELECTION_COOKIE, "", { path: "/", maxAge: 0 })
    
    return response
  }

  // Existing collector flow
  const collectorCookie = buildCollectorSessionCookie({
    shopifyCustomerId: shopifyCustomerId ? shopifyCustomerId.toString() : null,
    email,
    collectorIdentifier: null,
    impersonated: false,
    issuedAt: Date.now(),
  })

  const response = NextResponse.redirect(new URL(redirectParam, finalRedirectBase || undefined))
  response.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)

  if (shopifyCustomerId) {
    response.cookies.set("shopify_customer_id", shopifyCustomerId.toString(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    })
  }

  response.cookies.set(REQUIRE_ACCOUNT_SELECTION_COOKIE, "", { path: "/", maxAge: 0 })

  console.log(`[collector-google-callback] Collector login successful for ${email}`)
  return response
}
