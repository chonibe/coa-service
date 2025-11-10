import {
  buildVendorSessionCookie,
  clearVendorSessionCookie,
  createVendorSessionToken,
  getVendorFromCookieStore,
  verifyVendorSessionToken,
} from "@/lib/vendor-session"

const TEST_SECRET = "test-secret-32-bytes-value-1234567890"

describe("vendor-session helpers", () => {
  const originalSecret = process.env.VENDOR_SESSION_SECRET

  beforeAll(() => {
    process.env.VENDOR_SESSION_SECRET = TEST_SECRET
  })

  afterAll(() => {
    process.env.VENDOR_SESSION_SECRET = originalSecret
  })

  it("creates and verifies a signed token", () => {
    const token = createVendorSessionToken("Acme Vendor")
    expect(token.split(".")).toHaveLength(2)

    const payload = verifyVendorSessionToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.vendorName).toEqual("Acme Vendor")
    expect(typeof payload?.issuedAt).toBe("number")
  })

  it("rejects tampered signatures", () => {
    const token = createVendorSessionToken("Acme Vendor")
    const [payload] = token.split(".")
    const tampered = `${payload}.invalidsignature`

    const result = verifyVendorSessionToken(tampered)
    expect(result).toBeNull()
  })

  it("builds cookie metadata for vendor sessions", () => {
    const cookie = buildVendorSessionCookie("Acme Vendor")
    expect(cookie.name).toBe("vendor_session")
    expect(cookie.value).toEqual(expect.any(String))
    expect(cookie.options.httpOnly).toBe(true)
    expect(cookie.options.path).toBe("/")
    expect(cookie.options.maxAge).toBeGreaterThan(0)
  })

  it("clears vendor session cookies", () => {
    const clearCookie = clearVendorSessionCookie()
    expect(clearCookie.name).toBe("vendor_session")
    expect(clearCookie.options.maxAge).toBe(0)
  })

  it("reads vendor name from a cookie store", () => {
    const token = createVendorSessionToken("Acme Vendor")
    const mockCookieStore = {
      get: (name: string) => (name === "vendor_session" ? { value: token } : undefined),
    }

    const vendorName = getVendorFromCookieStore(mockCookieStore)
    expect(vendorName).toBe("Acme Vendor")
  })

  it("returns null when cookie store has no vendor session", () => {
    const mockCookieStore = {
      get: () => undefined,
    }

    const vendorName = getVendorFromCookieStore(mockCookieStore)
    expect(vendorName).toBeNull()
  })
})

