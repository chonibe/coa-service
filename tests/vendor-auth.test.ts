import type { User } from "@supabase/supabase-js"
import { isAdminEmail, sanitizeRedirectTarget, __test__, linkSupabaseUserToVendor } from "@/lib/vendor-auth"

jest.mock("@/lib/supabase/server", () => {
  return {
    createClient: jest.fn(() => createMockClient()),
  }
})

interface MockVendor {
  id: number
  vendor_name: string
  contact_email: string | null
  status: "pending" | "active" | "review" | "disabled" | "suspended" | null
  onboarded_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  instagram_url: string | null
  notes: string | null
  paypal_email: string | null
  payout_method: string | null
  password_hash: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean | null
  contact_name: string | null
  phone: string | null
  address: string | null
  website: string | null
  bio: string | null
  bank_account: string | null
  notify_on_sale: boolean | null
  notify_on_payout: boolean | null
  notify_on_message: boolean | null
  onboarding_completed: boolean | null
  onboarding_completed_at: string | null
}

interface MockVendorUser {
  id: string
  vendor_id: number
  auth_id: string | null
  email: string | null
  created_at: string
}

interface MockAdminAccount {
  id: string
  email: string
  auth_id: string | null
  created_at: string
}

const mockDb = {
  vendors: [] as MockVendor[],
  vendor_users: [] as MockVendorUser[],
  admin_accounts: [] as MockAdminAccount[],
}

const resetMockDb = () => {
  mockDb.vendors.splice(0, mockDb.vendors.length)
  mockDb.vendor_users.splice(0, mockDb.vendor_users.length)
  mockDb.admin_accounts.splice(0, mockDb.admin_accounts.length)
}

const randomId = () => Math.random().toString(36).slice(2, 10)

type Filter =
  | { type: "eq"; column: string; value: unknown }
  | { type: "ilike"; column: string; value: string }

const applyFilters = <T>(rows: T[], filters: Filter[]) => {
  if (filters.length === 0) return rows

  return rows.filter((row) =>
    filters.every((filter) => {
      const columnValue = (row as Record<string, unknown>)[filter.column]

      if (filter.type === "eq") {
        return columnValue === filter.value
      }

      if (filter.type === "ilike") {
        if (typeof columnValue !== "string") return false
        const pattern = filter.value.replace(/%/g, ".*")
        const regex = new RegExp(`^${pattern}$`, "i")
        return regex.test(columnValue)
      }

      return false
    }),
  )
}

const createQueryBuilder = (table: keyof typeof mockDb) => {
  const filters: Filter[] = []

  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      filters.push({ type: "eq", column, value })
      return builder
    },
    ilike: (column: string, value: string) => {
      filters.push({ type: "ilike", column, value })
      return builder
    },
    limit: () => builder,
    maybeSingle: async () => {
      const rows = applyFilters(mockDb[table], filters)
      return { data: rows[0] ?? null, error: null }
    },
    single: async () => {
      const rows = applyFilters(mockDb[table], filters)
      if (rows.length === 0) {
        return { data: null, error: new Error("not found") }
      }
      return { data: rows[0], error: null }
    },
    upsert: async (payload: Record<string, unknown>, options?: { onConflict?: string }) => {
      if (table === "vendor_users") {
        const conflictKey = options?.onConflict === "auth_id" ? "auth_id" : "email"
        const matchValue = payload[conflictKey]
        let existing = matchValue
          ? mockDb.vendor_users.find((row) => (row as Record<string, unknown>)[conflictKey] === matchValue)
          : undefined

        if (existing) {
          Object.assign(existing, payload)
        } else {
          mockDb.vendor_users.push({
            id: (payload.id as string) ?? randomId(),
            vendor_id: payload.vendor_id as number,
            auth_id: (payload.auth_id as string | null) ?? null,
            email: (payload.email as string | null) ?? null,
            created_at: new Date().toISOString(),
          })
        }

        return { data: null, error: null }
      }

      if (table === "admin_accounts") {
        const email = (payload.email as string).toLowerCase()
        const existing = mockDb.admin_accounts.find((row) => row.email === email)
        if (existing) {
          existing.auth_id = (payload.auth_id as string | null) ?? null
        } else {
          mockDb.admin_accounts.push({
            id: randomId(),
            email,
            auth_id: (payload.auth_id as string | null) ?? null,
            created_at: new Date().toISOString(),
          })
        }
        return { data: null, error: null }
      }

      return { data: null, error: null }
    },
    update: async (payload: Record<string, unknown>) => {
      const rows = applyFilters(mockDb[table], filters)
      rows.forEach((row) => {
        Object.assign(row, payload)
      })
      return { data: rows, error: null }
    },
  }

  return builder
}

const createMockClient = () => ({
  from: (table: string) => createQueryBuilder(table as keyof typeof mockDb),
})

describe("vendor auth helpers", () => {
  beforeEach(() => {
    resetMockDb()
  })

  describe("isAdminEmail", () => {
    it("identifies whitelisted admin emails", () => {
      expect(isAdminEmail("choni@thestreetlamp.com")).toBe(true)
      expect(isAdminEmail("Chonibe@gmail.com")).toBe(true)
    })

    it("returns false for non-admin emails", () => {
      expect(isAdminEmail("user@example.com")).toBe(false)
      expect(isAdminEmail(null)).toBe(false)
      expect(isAdminEmail(undefined)).toBe(false)
    })
  })

  describe("sanitizeRedirectTarget", () => {
    const origin = "https://app.thestreetcollector.com"

    it("allows relative paths", () => {
      expect(sanitizeRedirectTarget("/vendor/dashboard?tab=sales", origin)).toBe("/vendor/dashboard?tab=sales")
    })

    it("allows same-origin absolute URLs", () => {
      expect(sanitizeRedirectTarget("https://app.thestreetcollector.com/vendor/dashboard", origin)).toBe(
        "/vendor/dashboard",
      )
    })

    it("blocks cross-origin URLs", () => {
      expect(sanitizeRedirectTarget("https://malicious.com/hijack", origin)).toBe("/vendor/dashboard")
    })

    it("falls back for malformed URLs", () => {
      expect(sanitizeRedirectTarget("http://%%%", origin)).toBe("/vendor/dashboard")
    })

    it("uses provided fallback when candidate is empty", () => {
      expect(sanitizeRedirectTarget(null, origin, "/admin/dashboard")).toBe("/admin/dashboard")
    })
  })

  describe("linkSupabaseUserToVendor", () => {
    const buildUser = (overrides: Partial<User>): User => ({
      id: overrides.id ?? randomId(),
      email: overrides.email ?? "user@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: "authenticated",
      updated_at: new Date().toISOString(),
      factors: [],
      identities: [],
      invited_at: null,
      phone: null,
      phone_confirmed_at: null,
      confirmation_sent_at: null,
      recovery_sent_at: null,
      email_confirmed_at: new Date().toISOString(),
      confirmation_token: null,
      email_change: null,
      email_change_sent_at: null,
      email_change_token_current: null,
      email_change_token_new: null,
      instance_id: "instance",
      is_anonymous: false,
      last_sign_in_ip: null,
      role_id: null,
      raw_app_meta_data: {},
      raw_user_meta_data: {},
      ...overrides,
    })

    const seedVendor = (vendor: Partial<MockVendor>) => {
      const fullVendor: MockVendor = {
        id: vendor.id ?? Math.floor(Math.random() * 1000),
        vendor_name: vendor.vendor_name ?? "Example Vendor",
        contact_email: vendor.contact_email ?? null,
        status: vendor.status ?? "pending",
        onboarded_at: vendor.onboarded_at ?? null,
        last_login_at: vendor.last_login_at ?? null,
        created_at: vendor.created_at ?? new Date().toISOString(),
        updated_at: vendor.updated_at ?? new Date().toISOString(),
        instagram_url: vendor.instagram_url ?? null,
        notes: vendor.notes ?? null,
        paypal_email: vendor.paypal_email ?? null,
        payout_method: vendor.payout_method ?? null,
        password_hash: vendor.password_hash ?? null,
        tax_id: vendor.tax_id ?? null,
        tax_country: vendor.tax_country ?? null,
        is_company: vendor.is_company ?? null,
        contact_name: vendor.contact_name ?? null,
        phone: vendor.phone ?? null,
        address: vendor.address ?? null,
        website: vendor.website ?? null,
        bio: vendor.bio ?? null,
        bank_account: vendor.bank_account ?? null,
        notify_on_sale: vendor.notify_on_sale ?? null,
        notify_on_payout: vendor.notify_on_payout ?? null,
        notify_on_message: vendor.notify_on_message ?? null,
        onboarding_completed: vendor.onboarding_completed ?? null,
        onboarding_completed_at: vendor.onboarding_completed_at ?? null,
      }
      mockDb.vendors.push(fullVendor)
      return fullVendor
    }

    it("returns null for admin emails and upserts admin account", async () => {
      const result = await linkSupabaseUserToVendor(buildUser({ id: "admin-1", email: "choni@thestreetlamp.com" }))
      expect(result).toBeNull()
      expect(mockDb.admin_accounts).toHaveLength(1)
      expect(mockDb.admin_accounts[0].email).toBe("choni@thestreetlamp.com")
    })

    it("links override email to the Street Collector vendor", async () => {
      const vendor = seedVendor({ id: 1, vendor_name: "Street Collector" })

      const result = await linkSupabaseUserToVendor(
        buildUser({ id: "vendor-1", email: "kinggeorgelamp@gmail.com" }),
      )

      expect(result).toEqual({ id: vendor.id, vendor_name: "Street Collector", status: "active" })
      expect(mockDb.vendor_users).toHaveLength(1)
      expect(mockDb.vendor_users[0]).toMatchObject({
        vendor_id: vendor.id,
        auth_id: "vendor-1",
        email: "kinggeorgelamp@gmail.com",
      })
      expect(mockDb.vendors[0].contact_email).toBe("kinggeorgelamp@gmail.com")
      expect(mockDb.vendors[0].status).toBe("active")
    })

    it("reuses existing vendor user mapping by auth_id", async () => {
      const vendor = seedVendor({ id: 2, vendor_name: "Legacy Vendor", status: "pending" })
      mockDb.vendor_users.push({
        id: "vu-existing",
        vendor_id: vendor.id,
        auth_id: "legacy-user",
        email: null,
        created_at: new Date().toISOString(),
      })

      const result = await linkSupabaseUserToVendor(buildUser({ id: "legacy-user", email: "legacy@vendor.com" }))

      expect(result).toEqual({ id: vendor.id, vendor_name: "Legacy Vendor", status: "active" })
      expect(mockDb.vendor_users[0].email).toBe("legacy@vendor.com")
      expect(mockDb.vendors[0].status).toBe("active")
      expect(mockDb.vendors[0].contact_email).toBe("legacy@vendor.com")
    })

    it("attaches vendor user using contact email when no mapping exists", async () => {
      const vendor = seedVendor({ id: 3, vendor_name: "Contact Vendor", contact_email: "contact@vendor.com" })

      const result = await linkSupabaseUserToVendor(
        buildUser({ id: "contact-user", email: "contact@vendor.com" }),
      )

      expect(result).toEqual({ id: vendor.id, vendor_name: "Contact Vendor", status: "active" })
      expect(mockDb.vendor_users).toHaveLength(1)
      expect(mockDb.vendor_users[0]).toMatchObject({
        vendor_id: vendor.id,
        auth_id: "contact-user",
        email: "contact@vendor.com",
      })
      expect(mockDb.vendors[0].status).toBe("active")
    })
  })

  describe("email overrides", () => {
    it("includes Street Collector mapping", () => {
      expect(__test__.EMAIL_VENDOR_OVERRIDES["kinggeorgelamp@gmail.com"].vendorName).toBe("Street Collector")
    })
  })
})

