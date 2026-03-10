import { createAuthContext, UserRole, requireAuth } from '../lib/graphql/auth'
import jwt from 'jsonwebtoken'

// Shared mock: factory runs at hoist time so we attach the single fn to global for test to configure
jest.mock('@supabase/supabase-js', () => {
  const singleFn = jest.fn()
  ;(global as any).__authSupabaseSingle = singleFn
  return {
    createClient: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: singleFn,
    })),
  }
})

// Mock JWT secret
process.env.JWT_SECRET = 'test_secret'

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAuthContext', () => {
    it('should return null for no token', async () => {
      const context = await createAuthContext()
      expect(context.user).toBeNull()
    })

    it('should successfully validate a valid JWT token', async () => {
      const mockToken = jwt.sign(
        {
          sub: 'user123',
          email: 'test@example.com',
          role: UserRole.COLLECTOR
        },
        process.env.JWT_SECRET!
      )

      ;(global as any).__authSupabaseSingle.mockResolvedValue({
        data: {
          id: 'user123',
          email: 'test@example.com',
          role: UserRole.COLLECTOR
        },
        error: null
      })

      const context = await createAuthContext(mockToken)

      expect(context.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: UserRole.COLLECTOR
      })
    })

    it('should throw error for invalid token', async () => {
      const invalidToken = 'invalid.token.here'
      
      await expect(createAuthContext(invalidToken)).rejects.toThrow('Authentication failed')
    })
  })

  describe('requireAuth Middleware', () => {
    const mockResolver = jest.fn((parent, args, context) => context)

    it('should allow access for authenticated users', async () => {
      const authContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: UserRole.COLLECTOR
        }
      }

      const wrappedResolver = requireAuth()(mockResolver)
      const result = await wrappedResolver(null, {}, authContext, null)

      expect(result).toEqual(authContext)
    })

    it('should restrict access for unauthenticated users', async () => {
      const wrappedResolver = requireAuth()(mockResolver)

      await expect(
        wrappedResolver(null, {}, { user: null }, null)
      ).rejects.toThrow('Not authenticated')
    })

    it('should restrict access for users without required role', async () => {
      const authContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: UserRole.COLLECTOR
        }
      }

      const wrappedResolver = requireAuth([UserRole.ADMIN])(mockResolver)

      await expect(
        wrappedResolver(null, {}, authContext, null)
      ).rejects.toThrow('Insufficient permissions')
    })
  })
})
