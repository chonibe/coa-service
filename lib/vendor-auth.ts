import { createClient as createServiceRoleClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import type { User } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["choni@thestreetlamp.com", "chonibe@gmail.com"]

export const POST_LOGIN_REDIRECT_COOKIE = "vendor_post_login_redirect"
export const PENDING_VENDOR_EMAIL_COOKIE = "pending_vendor_email"

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

const selectVendorFields = () =>
  createServiceRoleClient()
    .from("vendors")
    .select("id,vendor_name,auth_id,contact_email,paypal_email")

const findVendorByAuthId = async (authId: string) => {
  const { data } = await selectVendorFields().eq("auth_id", authId).maybeSingle()
  return data ?? null
}

const findVendorByEmail = async (email: string) => {
  const { data } = await selectVendorFields()
    .or(`contact_email.eq.${email},paypal_email.eq.${email}`)
    .order("updated_at", { ascending: false })
    .maybeSingle()
  return data ?? null
}

const vendorNameExists = async (vendorName: string) => {
  const { data } = await createServiceRoleClient()
    .from("vendors")
    .select("id")
    .eq("vendor_name", vendorName)
    .maybeSingle()
  return !!data
}

const generateUniqueVendorName = async (email: string | null, userId: string) => {
  const fallback = `vendor-${userId.slice(0, 8)}`
  const base = createVendorNameCandidate(email, fallback)

  if (!(await vendorNameExists(base))) {
    return base
  }

  let attempt = 1
  while (attempt < 20) {
    const candidate = `${base}-${attempt}`
    if (!(await vendorNameExists(candidate))) {
      return candidate
    }
    attempt += 1
  }

  return `${base}-${Date.now()}`
}

export interface LinkedVendor {
  id: number
  vendor_name: string
}

export const linkSupabaseUserToVendor = async (user: User): Promise<LinkedVendor | null> => {
  const authId = user.id
  const email = normalizeEmail(user.email)
  const serviceClient = createServiceRoleClient()

  const existing = await findVendorByAuthId(authId)
  if (existing) {
    return { id: existing.id, vendor_name: existing.vendor_name }
  }

  if (email) {
    const vendorByEmail = await findVendorByEmail(email)
    if (vendorByEmail) {
      const { data, error } = await serviceClient
        .from("vendors")
        .update({ auth_id: authId, contact_email: vendorByEmail.contact_email ?? email })
        .eq("id", vendorByEmail.id)
        .select("id,vendor_name")
        .maybeSingle()

      if (error) {
        console.error("Failed to link vendor by email:", error)
      } else if (data) {
        return data
      }
    }
  }

  if (isAdminEmail(email)) {
    // Admins can impersonate vendors without creating dedicated records.
    return null
  }

  const vendorName = await generateUniqueVendorName(email, authId)

  const { data, error } = await serviceClient
    .from("vendors")
    .insert({
      vendor_name,
      auth_id: authId,
      contact_email: email,
      onboarding_completed: false,
      onboarding_completed_at: null,
    })
    .select("id,vendor_name")
    .maybeSingle()

  if (error) {
    console.error("Failed to create vendor for Supabase user:", error)
    return null
  }

  return data ?? null
}

export const ADMIN_EMAIL_WHITELIST = ADMIN_EMAILS

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

