import { randomBytes } from "crypto"
import { createClient as createServiceRoleClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import type { User } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["choni@thestreetlamp.com", "chonibe@gmail.com"]

export const SIGNUP_STATUS_COMPLETED = "completed"
export const SIGNUP_STATUS_PENDING = "pending"
export const SIGNUP_STATUS_APPROVED = "approved"

export type SignupStatus =
  | typeof SIGNUP_STATUS_COMPLETED
  | typeof SIGNUP_STATUS_PENDING
  | typeof SIGNUP_STATUS_APPROVED

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

let serviceClientOverride: ReturnType<typeof createServiceRoleClient> | null = null

const getServiceClient = () => serviceClientOverride ?? createServiceRoleClient()

export const __setVendorAuthServiceClient = (client: ReturnType<typeof createServiceRoleClient> | null) => {
  serviceClientOverride = client
}

const selectVendorFields = () =>
  getServiceClient()
    .from("vendors")
    .select(
      "id,vendor_name,auth_id,contact_email,paypal_email,signup_status,auth_pending_email,invite_code,onboarding_completed,onboarding_completed_at",
    )

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

const findVendorByPendingEmail = async (email: string) => {
  const { data } = await selectVendorFields()
    .eq("auth_pending_email", email)
    .maybeSingle()
  return data ?? null
}

const vendorNameExists = async (vendorName: string) => {
  const { data } = await getServiceClient()
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

const generateInviteCode = () => randomBytes(6).toString("hex")

export const linkSupabaseUserToVendor = async (
  user: User,
  options: { autoCreate?: boolean } = { autoCreate: true },
): Promise<LinkedVendor | null> => {
  const authId = user.id
  const email = normalizeEmail(user.email)
  const serviceClient = getServiceClient()

  const resolution = await resolveVendorAuthState(user)

  if (resolution.status === "linked") {
    return resolution.vendor
  }

  if (resolution.status === "pending") {
    // Pending vendors will be handled by signup flow/admin approval.
    return null
  }

  if (resolution.status === "admin") {
    return null
  }

  if (!options.autoCreate) {
    return null
  }

  const vendorByEmail = email ? await findVendorByEmail(email) : null
  if (vendorByEmail) {
    const { data, error } = await serviceClient
      .from("vendors")
      .update({
        auth_id: authId,
        contact_email: vendorByEmail.contact_email ?? email,
        signup_status: SIGNUP_STATUS_COMPLETED,
        auth_pending_email: null,
      })
      .eq("id", vendorByEmail.id)
      .select("id,vendor_name")
      .maybeSingle()

    if (error) {
      console.error("Failed to link vendor by email:", error)
    } else if (data) {
      return data
    }
  }

  if (!email) {
    return null
  }

  const vendorName = await generateUniqueVendorName(email, authId)

  const { data, error } = await serviceClient
    .from("vendors")
    .insert({
      vendor_name,
      auth_id: authId,
      contact_email: email,
      signup_status: SIGNUP_STATUS_APPROVED,
      auth_pending_email: null,
      invite_code: generateInviteCode(),
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

export const linkVendorByKnownEmail = async (user: User): Promise<LinkedVendor | null> => {
  const authId = user.id
  const email = normalizeEmail(user.email)

  if (!email) {
    return null
  }

  const existing = await findVendorByAuthId(authId)
  if (existing) {
    return { id: existing.id, vendor_name: existing.vendor_name }
  }

  const vendorByEmail = await findVendorByEmail(email)
  if (!vendorByEmail) {
    return null
  }

  const serviceClient = getServiceClient()
  const nextStatus =
    vendorByEmail.signup_status === SIGNUP_STATUS_COMPLETED ? SIGNUP_STATUS_COMPLETED : SIGNUP_STATUS_APPROVED

  const { data, error } = await serviceClient
    .from("vendors")
    .update({
      auth_id: authId,
      contact_email: vendorByEmail.contact_email ?? email,
      signup_status: nextStatus,
      auth_pending_email: null,
    })
    .eq("id", vendorByEmail.id)
    .select("id,vendor_name")
    .maybeSingle()

  if (error) {
    console.error("Failed to link vendor by known email:", error)
    return null
  }

  return data ?? null
}

export const ADMIN_EMAIL_WHITELIST = ADMIN_EMAILS

export type VendorAuthResolution =
  | { status: "linked"; vendor: LinkedVendor }
  | { status: "pending"; vendor?: LinkedVendor; email: string | null }
  | { status: "admin"; email: string | null }
  | { status: "unlinked"; email: string | null }

export const resolveVendorAuthState = async (user: User): Promise<VendorAuthResolution> => {
  const authId = user.id
  const email = normalizeEmail(user.email)

  if (isAdminEmail(email)) {
    return { status: "admin", email }
  }

  const existingVendor = await findVendorByAuthId(authId)
  if (existingVendor) {
    const status = existingVendor.signup_status ?? SIGNUP_STATUS_COMPLETED
    const isApproved = status === SIGNUP_STATUS_COMPLETED || status === SIGNUP_STATUS_APPROVED

    if (isApproved) {
      return { status: "linked", vendor: { id: existingVendor.id, vendor_name: existingVendor.vendor_name } }
    }

    return {
      status: "pending",
      vendor: { id: existingVendor.id, vendor_name: existingVendor.vendor_name },
      email,
    }
  }

  if (email) {
    const pendingVendor = await findVendorByPendingEmail(email)
    if (pendingVendor) {
      return {
        status: "pending",
        vendor: {
          id: pendingVendor.id,
          vendor_name: pendingVendor.vendor_name,
        },
        email,
      }
    }
  }

  return { status: "unlinked", email }
}

export const createVendorSignup = async (
  user: User,
  vendorName: string,
): Promise<{ vendor: LinkedVendor; inviteCode: string }> => {
  const authId = user.id
  const email = normalizeEmail(user.email)

  if (!email) {
    throw new Error("Cannot create vendor signup without an email address")
  }

  const serviceClient = getServiceClient()

  const existing = await findVendorByAuthId(authId)
  if (existing) {
    return {
      vendor: { id: existing.id, vendor_name: existing.vendor_name },
      inviteCode: existing.invite_code ?? "",
    }
  }

  const { data: existingName } = await serviceClient
    .from("vendors")
    .select("id")
    .eq("vendor_name", vendorName)
    .maybeSingle()

  if (existingName) {
    throw new Error("Vendor name already in use")
  }

  const inviteCode = generateInviteCode()

  const { data, error } = await serviceClient
    .from("vendors")
    .insert({
      vendor_name: vendorName,
      auth_id: authId,
      contact_email: email,
      signup_status: SIGNUP_STATUS_APPROVED,
      auth_pending_email: null,
      invite_code: inviteCode,
      onboarding_completed: false,
      onboarding_completed_at: null,
    })
    .select("id,vendor_name,invite_code")
    .maybeSingle()

  if (error || !data) {
    throw new Error(error?.message || "Failed to create vendor signup")
  }

  return {
    vendor: { id: data.id, vendor_name: data.vendor_name },
    inviteCode: data.invite_code ?? inviteCode,
  }
}

export const requestVendorClaimByInvite = async (
  user: User,
  inviteCode: string,
): Promise<{ vendor: LinkedVendor }> => {
  const serviceClient = getServiceClient()
  const email = normalizeEmail(user.email)

  if (!email) {
    throw new Error("Cannot request claim without an email address")
  }

  const { data: vendor, error } = await serviceClient
    .from("vendors")
    .select("id,vendor_name,auth_id,auth_pending_email,signup_status")
    .eq("invite_code", inviteCode)
    .maybeSingle()

  if (error || !vendor) {
    throw new Error("Invalid invite code")
  }

  if (vendor.auth_id && vendor.auth_id !== user.id) {
    throw new Error("Vendor is already linked to a different account")
  }

  const { data: updated, error: updateError } = await serviceClient
    .from("vendors")
    .update({
      auth_pending_email: email,
      signup_status: SIGNUP_STATUS_PENDING,
    })
    .eq("id", vendor.id)
    .select("id,vendor_name")
    .maybeSingle()

  if (updateError || !updated) {
    throw new Error(updateError?.message || "Failed to submit pairing request")
  }

  return { vendor: { id: updated.id, vendor_name: updated.vendor_name } }
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

