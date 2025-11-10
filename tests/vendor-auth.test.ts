import { isAdminEmail, sanitizeRedirectTarget } from "@/lib/vendor-auth"

describe("vendor auth helpers", () => {
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
    const origin = "https://street-collector.vercel.app"

    it("allows relative paths", () => {
      expect(sanitizeRedirectTarget("/vendor/dashboard?tab=sales", origin)).toBe("/vendor/dashboard?tab=sales")
    })

    it("allows same-origin absolute URLs", () => {
      expect(sanitizeRedirectTarget("https://street-collector.vercel.app/vendor/dashboard", origin)).toBe(
        "/vendor/dashboard",
      )
    })

    it("blocks cross-origin URLs", () => {
      expect(sanitizeRedirectTarget("https://malicious.com/hijack", origin)).toBe("/vendor/dashboard")
    })

    it("falls back for malformed URLs", () => {
      expect(sanitizeRedirectTarget("http://%%%", origin)).toBe("/vendor/dashboard")
    })
  })
})

