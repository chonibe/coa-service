import { resolvers } from '../lib/graphql/resolvers'
import { createClient } from '@supabase/supabase-js'
import { UserRole } from '../lib/graphql/auth'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis()
  }))
}))

describe('GraphQL Resolvers', () => {
  const mockContext = {
    user: {
      id: 'user123',
      email: 'test@example.com',
      role: UserRole.ARTIST
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Resolvers', () => {
    it('should fetch user by ID', async () => {
      const mockSupabaseClient = createClient('', '')
      const mockSelect = mockSupabaseClient.from('users').select
      const mockEq = mockSelect('*').eq
      const mockSingle = mockEq('id', 'user123').single

      mockSingle.mockResolvedValue({
        data: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        },
        error: null
      })

      const result = await resolvers.Query.user(null, { id: 'user123' }, mockContext, null)
      
      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    it('should fetch artwork by ID', async () => {
      const mockSupabaseClient = createClient('', '')
      const mockSelect = mockSupabaseClient.from('artworks').select
      const mockEq = mockSelect('*, artist:users(id, email, name)').eq
      const mockSingle = mockEq('id', 'artwork123').single

      mockSingle.mockResolvedValue({
        data: {
          id: 'artwork123',
          title: 'Test Artwork',
          artist: {
            id: 'user123',
            email: 'artist@example.com',
            name: 'Artist Name'
          }
        },
        error: null
      })

      const result = await resolvers.Query.artwork(null, { id: 'artwork123' }, mockContext, null)
      
      expect(result).toEqual({
        id: 'artwork123',
        title: 'Test Artwork',
        artist: {
          id: 'user123',
          email: 'artist@example.com',
          name: 'Artist Name'
        }
      })
    })
  })

  describe('Mutation Resolvers', () => {
    it('should create artwork', async () => {
      const mockSupabaseClient = createClient('', '')
      const mockFrom = mockSupabaseClient.from('artworks')
      const mockInsert = mockFrom.insert
      const mockSelect = mockInsert({
        title: 'New Artwork',
        description: 'Test Description',
        price: 100,
        status: 'AVAILABLE',
        artist_id: 'user123'
      }).select

      mockSelect.mockResolvedValue({
        data: {
          id: 'new-artwork-123',
          title: 'New Artwork',
          description: 'Test Description',
          price: 100,
          status: 'AVAILABLE',
          artist_id: 'user123'
        },
        error: null
      })

      const result = await resolvers.Mutation.createArtwork(
        null, 
        { 
          title: 'New Artwork', 
          description: 'Test Description', 
          price: 100 
        }, 
        mockContext, 
        null
      )
      
      expect(result).toEqual({
        id: 'new-artwork-123',
        title: 'New Artwork',
        description: 'Test Description',
        price: 100,
        status: 'AVAILABLE',
        artist_id: 'user123'
      })
    })

    it('should create order', async () => {
      const mockSupabaseClient = createClient('', '')
      const mockOrdersFrom = mockSupabaseClient.from('orders')
      const mockOrderInsert = mockOrdersFrom.insert({
        user_id: 'user123',
        status: 'PENDING',
        total: 0
      }).select

      const mockOrderItemsFrom = mockSupabaseClient.from('order_items')
      const mockOrderItemsInsert = mockOrderItemsFrom.insert

      mockOrderInsert.mockResolvedValue({
        data: {
          id: 'order-123',
          user_id: 'user123',
          status: 'PENDING',
          total: 0
        },
        error: null
      })

      mockOrderItemsInsert.mockResolvedValue({
        error: null
      })

      const result = await resolvers.Mutation.createOrder(
        null, 
        { 
          userId: 'user123', 
          artworkIds: ['artwork1', 'artwork2'] 
        }, 
        mockContext, 
        null
      )
      
      expect(result).toEqual({
        id: 'order-123',
        user_id: 'user123',
        status: 'PENDING',
        total: 0
      })
    })
  })
})
