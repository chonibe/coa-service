import { NextRequest, NextResponse } from 'next/server'
import { guardAdminRequest, guardVendorRequest } from '../lib/auth-guards'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '../lib/admin-session'
import { getVendorFromCookieStore } from '../lib/vendor-session'
import { createClient as createSupabaseClient } from '../lib/supabase/server'

// Mock dependencies
jest.mock('../lib/admin-session', () => ({
  ADMIN_SESSION_COOKIE_NAME: 'admin_session',
  verifyAdminSessionToken: jest.fn(),
  clearAdminSessionCookie: jest.fn(() => ({ options: {} }))
}))

jest.mock('../lib/vendor-session', () => ({
  getVendorFromCookieStore: jest.fn(),
  clearVendorSessionCookie: jest.fn(() => ({ options: {} }))
}))

jest.mock('../lib/vendor-auth', () => ({
  isAdminEmail: jest.fn(email => email.endsWith('@admin.com'))
}))

jest.mock('../lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn()
  }))
}))

describe('Auth Guards (RBAC)', () => {
  let mockRequest: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = {
      cookies: {
        get: jest.fn()
      },
      nextUrl: {
        pathname: '/api/test',
        origin: 'http://localhost:3000'
      },
      url: 'http://localhost:3000/api/test'
    }
  })

  describe('guardAdminRequest', () => {
    it('should return ok for valid admin session', () => {
      ;(verifyAdminSessionToken as jest.Mock).mockReturnValue({ email: 'test@admin.com' })
      mockRequest.cookies.get.mockReturnValue({ value: 'valid-token' })

      const result = guardAdminRequest(mockRequest as any)
      expect(result.kind).toBe('ok')
    })

    it('should return unauthorized for invalid admin session', () => {
      ;(verifyAdminSessionToken as jest.Mock).mockReturnValue(null)
      mockRequest.cookies.get.mockReturnValue({ value: 'invalid-token' })

      const result = guardAdminRequest(mockRequest as any)
      expect(result.kind).toBe('unauthorized')
    })
  })

  describe('guardVendorRequest', () => {
    it('should return ok for valid vendor session', async () => {
      ;(getVendorFromCookieStore as jest.Mock).mockReturnValue('test-vendor')
      const mockSupabase = createSupabaseClient()
      ;(mockSupabase.from('').maybeSingle as jest.Mock).mockResolvedValue({
        data: { vendor_name: 'test-vendor', status: 'active', onboarding_completed: true },
        error: null
      })

      const result = await guardVendorRequest(mockRequest as any)
      expect(result.kind).toBe('ok')
      if (result.kind === 'ok') {
        expect(result.vendorName).toBe('test-vendor')
      }
    })

    it('should block suspended vendors', async () => {
      ;(getVendorFromCookieStore as jest.Mock).mockReturnValue('suspended-vendor')
      const mockSupabase = createSupabaseClient()
      ;(mockSupabase.from('').maybeSingle as jest.Mock).mockResolvedValue({
        data: { vendor_name: 'suspended-vendor', status: 'suspended' },
        error: null
      })

      const result = await guardVendorRequest(mockRequest as any)
      expect(result.kind).toBe('redirect')
    })
  })
})

