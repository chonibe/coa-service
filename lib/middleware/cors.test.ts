import { NextRequest, NextResponse } from 'next/server'
import { isOriginAllowed, getAllowedOrigins } from './cors'

// Mock environment variables
const originalEnv = process.env

describe('CORS Middleware Logic', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getAllowedOrigins', () => {
    it('should return default origins when no environment variable is set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.test.com'
      const origins = getAllowedOrigins()
      expect(origins).toContain('https://app.test.com')
      expect(origins).toContain('http://localhost:3000')
    })

    it('should include origins from ALLOWED_ORIGINS', () => {
      process.env.ALLOWED_ORIGINS = 'https://other.com, https://another.com'
      const origins = getAllowedOrigins()
      expect(origins).toContain('https://other.com')
      expect(origins).toContain('https://another.com')
    })
  })

  describe('isOriginAllowed', () => {
    const allowed = ['https://app.test.com', '*.example.com']

    it('should allow exact match', () => {
      expect(isOriginAllowed('https://app.test.com', allowed)).toBe(true)
    })

    it('should allow wildcard subdomain match', () => {
      expect(isOriginAllowed('https://sub.example.com', allowed)).toBe(true)
      expect(isOriginAllowed('https://deep.sub.example.com', allowed)).toBe(true)
    })

    it('should deny non-matching origin', () => {
      expect(isOriginAllowed('https://malicious.com', allowed)).toBe(false)
    })

    it('should allow null origin (same-origin)', () => {
      expect(isOriginAllowed(null, allowed)).toBe(true)
    })
  })
})

