import { createClient as createServiceRoleClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import type { User } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["choni@thestreetlamp.com", "chonibe@gmail.com"]

const EMAIL_VENDOR_OVERRIDES: Record<
  string,
  {
    vendorName: string
    contactEmail?: string | null
  }
> = {
  "kinggeorgelamp@gmail.com": {
    vendorName: "Street Collector", // Vendor exists in database (id: 45)
    contactEmail: "kinggeorgelamp@gmail.com",
  },
}

export const POST_LOGIN_REDIRECT_COOKIE = "vendor_post_login_redirect"
export const PENDING_VENDOR_EMAIL_COOKIE = "pending_vendor_email"
export const REQUIRE_ACCOUNT_SELECTION_COOKIE = "require_account_selection"
export const LOGIN_INTENT_COOKIE = "login_intent"

export const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

const normalizeEmail = (email: string | null | undefined) => email?.trim().toLowerCase() || null

const createVendorNameCandidate = (email: string | null | undefined, fallback: string) => {
  if (!email) return fallback
  const localPart = email.split("@")[0] || fallback
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized.length > 2 ? normalized : fallback
}

type VendorRow = Database["public"]["Tables"]["vendors"]["Row"]

type VendorUserRow = Database["public"]["Tables"]["vendor_users"]["Row"]

type AdminAccountRow = Database["public"]["Tables"]["admin_accounts"]["Row"]

const serviceClient = () => createServiceRoleClient()

const selectVendors = () => serviceClient().from("vendors").select("*")

const findVendorByVendorName = async (vendorName: string) => {
  // Try exact match first
  const directMatch = await selectVendors().eq("vendor_name", vendorName).maybeSingle<VendorRow>()
  if (directMatch.data) {
    return directMatch.data
  }

  // Try case-insensitive exact match
  const caseInsensitiveMatch = await selectVendors()
    .ilike("vendor_name", vendorName)
    .maybeSingle<VendorRow>()
  if (caseInsensitiveMatch.data) {
    return caseInsensitiveMatch.data
  }

  // Try partial match as fallback
  const normalized = vendorName.replace(/[-_]+/g, " ")
  const { data } = await selectVendors()
    .ilike("vendor_name", `%${normalized}%`)
    .maybeSingle<VendorRow>()
  return data ?? null
}

const findVendorByContactEmail = async (email: string) => {
  const normalized = email.toLowerCase()
  const { data } = await selectVendors()
    .eq("contact_email", normalized)
    .maybeSingle<VendorRow>()
  return data ?? null
}

const findVendorUserByAuthId = async (authId: string) => {
  const { data } = await serviceClient()
    .from("vendor_users")
    .select("id,vendor_id,auth_id,email")
    .eq("auth_id", authId)
    .maybeSingle<VendorUserRow>()
  return data ?? null
}

const findVendorUserByEmail = async (email: string) => {
  const normalized = email.toLowerCase()
  const { data } = await serviceClient()
    .from("vendor_users")
    .select("id,vendor_id,auth_id,email")
    .eq("email", normalized)
    .maybeSingle<VendorUserRow>()
  return data ?? null
}

const upsertAdminAccount = async (authId: string, email: string | null) => {
  if (!email) return
  const normalized = email.toLowerCase()
  const { error } = await serviceClient()
    .from("admin_accounts")
    .upsert({ email: normalized, auth_id: authId }, { onConflict: "email" })
  if (error) {
    console.error("Failed to upsert admin account", error)
  }
}

const setVendorStatusActive = async (vendorId: number) => {
  const now = new Date().toISOString()
  const { error } = await serviceClient()
    .from("vendors")
    .update({ status: "active", onboarded_at: now, last_login_at: now })
    .eq("id", vendorId)
  if (error) {
    console.error("Failed to mark vendor active", error)
  }
}

const attachVendorUser = async (vendorId: number, authId: string, email: string | null) => {
  const normalized = email ? email.toLowerCase() : null
  const payload = {
    vendor_id: vendorId,
    auth_id: authId,
    email: normalized,
  }
  const client = serviceClient()
  const { error } = await client.from("vendor_users").upsert(payload, { onConflict: "auth_id" })
  if (error) {
    console.error("Failed to upsert vendor user", error)
  }

  if (normalized) {
    const { error: vendorUpdateError } = await client
      .from("vendors")
      .update({ contact_email: normalized })
      .eq("id", vendorId)

    if (vendorUpdateError) {
      console.error("Failed to sync vendor contact email", vendorUpdateError)
    }
  }
}

export interface LinkedVendor {
  id: number
  vendor_name: string
  status: VendorRow["status"] | null
}

export const linkSupabaseUserToVendor = async (
  user: User,
  options: { allowCreate?: boolean } = {},
): Promise<LinkedVendor | null> => {
  const authId = user.id
  const email = normalizeEmail(user.email)
  const allowCreate = options.allowCreate ?? false

  // Check for email vendor override FIRST, before admin check
  // This allows specific emails to be linked to vendors even if they're in admin list
  if (email) {
    const override = EMAIL_VENDOR_OVERRIDES[email]
    if (override?.vendorName) {
      console.log(`[vendor-auth] Found email override for ${email} -> ${override.vendorName}`)
      let vendor = await findVendorByVendorName(override.vendorName)
      
      // If vendor doesn't exist, create it for override emails
      if (!vendor) {
        console.log(`[vendor-auth] Override vendor "${override.vendorName}" not found, creating it`)
        const { data: newVendor, error: createError } = await serviceClient()
          .from("vendors")
          .insert({
            vendor_name: override.vendorName,
            contact_email: override.contactEmail ?? email,
            status: "active",
            onboarding_completed: true,
            onboarded_at: new Date().toISOString(),
            last_login_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (createError) {
          console.error(`[vendor-auth] Failed to create vendor "${override.vendorName}":`, createError)
        } else if (newVendor) {
          vendor = newVendor
          console.log(`[vendor-auth] Created vendor "${override.vendorName}" with id ${vendor.id}`)
        }
      }
      
      if (vendor) {
        await attachVendorUser(vendor.id, authId, override.contactEmail ?? email)
        await setVendorStatusActive(vendor.id)
        console.log(`[vendor-auth] Successfully linked ${email} to vendor ${vendor.vendor_name}`)
        return { id: vendor.id, vendor_name: vendor.vendor_name, status: "active" }
      }
    }
  }

  // Only skip vendor linking if email is admin AND not in override list
  if (email && isAdminEmail(email)) {
    await upsertAdminAccount(authId, email)
    return null
  }

  const existingVendorUser = await findVendorUserByAuthId(authId)
  if (existingVendorUser) {
    if (email && existingVendorUser.email?.toLowerCase() !== email) {
      const { error } = await serviceClient()
        .from("vendor_users")
        .update({ email })
        .eq("id", existingVendorUser.id)
      if (error) {
        console.error("Failed to update vendor user email", error)
      }
    }

    await setVendorStatusActive(existingVendorUser.vendor_id)

    const { data: vendor } = await selectVendors().eq("id", existingVendorUser.vendor_id).maybeSingle<VendorRow>()
    return vendor
      ? {
          id: vendor.id,
          vendor_name: vendor.vendor_name,
          status: vendor.status ?? null,
        }
      : null
  }

  if (!email) {
    return null
  }

  let vendorUser = await findVendorUserByEmail(email)
  if (vendorUser && !vendorUser.auth_id) {
    // Admin-assigned email: attach the auth_id to link the user
    const { error } = await serviceClient()
      .from("vendor_users")
      .update({ auth_id: authId })
      .eq("id", vendorUser.id)
    if (error) {
      console.error("Failed to attach auth_id to vendor user", error)
    } else {
      vendorUser = { ...vendorUser, auth_id: authId }
    }
  }

  if (!vendorUser) {
    // Try to find vendor by contact_email in vendors table
    const vendorByContact = await findVendorByContactEmail(email)
    if (vendorByContact) {
      await attachVendorUser(vendorByContact.id, authId, email)
      await setVendorStatusActive(vendorByContact.id)
      const { data: vendor } = await selectVendors().eq("id", vendorByContact.id).maybeSingle<VendorRow>()
      return vendor
        ? {
            id: vendor.id,
            vendor_name: vendor.vendor_name,
            status: vendor.status ?? "active",
          }
        : null
    }
  }

  // Sync email if it changed
  if (email && vendorUser) {
    const normalizedEmail = email.toLowerCase()
    if (vendorUser.email?.toLowerCase() !== normalizedEmail) {
      const { error: syncEmail } = await serviceClient()
        .from("vendor_users")
        .update({ email: normalizedEmail })
        .eq("id", vendorUser.id)
      if (syncEmail) {
        console.error("Failed to sync vendor user email", syncEmail)
      }
    }
  }

  // If vendor user exists and either has matching auth_id or no auth_id (admin-assigned email)
  if (vendorUser && (vendorUser.auth_id === authId || !vendorUser.auth_id)) {
    // If auth_id wasn't set, set it now
    if (!vendorUser.auth_id) {
      const { error: attachError } = await serviceClient()
        .from("vendor_users")
        .update({ auth_id: authId })
        .eq("id", vendorUser.id)
      if (attachError) {
        console.error("Failed to attach auth_id to vendor user", attachError)
      }
    }
    
    await setVendorStatusActive(vendorUser.vendor_id)
    const { data: vendor } = await selectVendors().eq("id", vendorUser.vendor_id).maybeSingle<VendorRow>()
    return vendor
      ? {
          id: vendor.id,
          vendor_name: vendor.vendor_name,
          status: vendor.status ?? null,
        }
      : null
  }

  // Override check is now done at the beginning of the function
  // This code path should not be reached for override emails, but keeping for safety
  if (email) {
    const override = EMAIL_VENDOR_OVERRIDES[email]
    if (override?.vendorName) {
      console.log(`[vendor-auth] Fallback: Found email override for ${email} -> ${override.vendorName}`)
      const vendor = await findVendorByVendorName(override.vendorName)
      if (vendor) {
        await attachVendorUser(vendor.id, authId, override.contactEmail ?? email)
        await setVendorStatusActive(vendor.id)
        return { id: vendor.id, vendor_name: vendor.vendor_name, status: "active" }
      }
    }
  }

  if (!allowCreate) {
    return null
  }

  const vendorCandidate = await findVendorByVendorName(createVendorNameCandidate(email, `vendor-${authId.slice(0, 8)}`))
  if (!vendorCandidate) {
    return null
  }

  await attachVendorUser(vendorCandidate.id, authId, email)
  await setVendorStatusActive(vendorCandidate.id)

  return { id: vendorCandidate.id, vendor_name: vendorCandidate.vendor_name, status: "active" }
}

export const ADMIN_EMAIL_WHITELIST = ADMIN_EMAILS

export const __test__ = {
  EMAIL_VENDOR_OVERRIDES,
}

export const sanitizeRedirectTarget = (
  candidate: string | null | undefined,
  origin: string,
  fallback = "/vendor/dashboard",
) => {
  if (!candidate) return fallback

  try {
    if (candidate.startsWith("/")) {
      return candidate
    }

    const targetUrl = new URL(candidate, origin)
    const originUrl = new URL(origin)

    if (targetUrl.origin === originUrl.origin) {
      return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
    }

    console.warn("Discarding unsafe redirect target:", candidate)
    return fallback
  } catch (error) {
    console.warn("Failed to parse redirect target:", candidate, error)
    return fallback
  }
}

