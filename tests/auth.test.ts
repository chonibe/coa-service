import { createAuthContext, UserRole, requireAuth } from '../lib/graphql/auth'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
}))

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
      // Create a mock valid token
      const mockToken = jwt.sign(
        { 
          sub: 'user123', 
          email: 'test@example.com', 
          role: UserRole.COLLECTOR 
        }, 
        process.env.JWT_SECRET!
      )

      // Mock Supabase response
      const mockSupabaseClient = createClient('', '')
      const mockSelect = mockSupabaseClient.from('users').select
      const mockEq = mockSelect('id, email, role').eq
      const mockSingle = mockEq('id', 'user123').single

      mockSingle.mockResolvedValue({
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

    it('should allow access for authenticated users', () => {
      const authContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: UserRole.COLLECTOR
        }
      }

      const wrappedResolver = requireAuth()(mockResolver)
      const result = wrappedResolver(null, {}, authContext, null)
      
      expect(result).toEqual(authContext)
    })

    it('should restrict access for unauthenticated users', () => {
      const wrappedResolver = requireAuth()(mockResolver)
      
      expect(() => {
        wrappedResolver(null, {}, { user: null }, null)
      }).toThrow('Not authenticated')
    })

    it('should restrict access for users without required role', () => {
      const authContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: UserRole.COLLECTOR
        }
      }

      const wrappedResolver = requireAuth([UserRole.ADMIN])(mockResolver)
      
      expect(() => {
        wrappedResolver(null, {}, authContext, null)
      }).toThrow('Insufficient permissions')
    })
  })
})
