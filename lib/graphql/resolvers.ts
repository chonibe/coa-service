import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const resolvers = {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    artwork: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('artworks')
        .select('*, artist:users(id, email, name)')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    order: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, user:users(id, email), artworks:order_items(artwork:artworks(*))')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    artworks: async (_: any, { status }: { status?: string }) => {
      let query = supabase.from('artworks').select('*, artist:users(id, email, name)')
      
      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)
      return data
    }
  },

  Mutation: {
    createArtwork: async (_: any, args: any, context: any) => {
      // Add authorization check
      const { data, error } = await supabase
        .from('artworks')
        .insert({
          title: args.title,
          description: args.description,
          price: args.price,
          status: 'AVAILABLE',
          artist_id: context.user.id
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    createOrder: async (_: any, args: any, context: any) => {
      // Add authorization and validation
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: args.userId,
          status: 'PENDING',
          total: 0 // Calculate total from artworks
        })
        .select()
        .single()

      if (orderError) throw new Error(orderError.message)

      // Insert order items
      const orderItemsInsert = args.artworkIds.map((artworkId: string) => ({
        order_id: orderData.id,
        artwork_id: artworkId
      }))

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsInsert)

      if (orderItemsError) throw new Error(orderItemsError.message)

      return orderData
    }
  }
} 