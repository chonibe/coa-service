import { GraphQLError } from 'graphql'
import { createClient } from '@/lib/supabase/server'

/**
 * CRM GraphQL Resolvers
 * Implements all query and mutation resolvers for the CRM GraphQL API
 */

interface GraphQLContext {
  user: {
    id: string
    email: string
  } | null
  supabase: ReturnType<typeof createClient>
}

// Helper to get Supabase client
const getSupabase = (context: GraphQLContext) => {
  return context.supabase
}

// Query Resolvers
export const queryResolvers = {
  person: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      instagramUsername: data.instagram_username,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent?.toString(),
      enrichmentData: data.enrichment_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  people: async (
    _: any,
    { first = 20, after, filter }: { first?: number; after?: string; filter?: any },
    context: GraphQLContext
  ) => {
    const supabase = getSupabase(context)
    
    let query = supabase
      .from('crm_customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(first)

    // TODO: Apply filter
    if (filter) {
      // Filter parsing logic here
    }

    // TODO: Apply cursor pagination
    if (after) {
      // Cursor pagination logic here
    }

    const { data, error } = await query

    if (error) {
      throw new GraphQLError(error.message)
    }

    const edges = (data || []).map((person: any) => ({
      node: {
        id: person.id,
        email: person.email,
        firstName: person.first_name,
        lastName: person.last_name,
        phone: person.phone,
        instagramUsername: person.instagram_username,
        totalOrders: person.total_orders,
        totalSpent: person.total_spent?.toString(),
        enrichmentData: person.enrichment_data,
        createdAt: person.created_at,
        updatedAt: person.updated_at,
      },
      cursor: person.id, // Simple cursor implementation
    }))

    return {
      edges,
      pageInfo: {
        hasNextPage: (data || []).length === first,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    }
  },

  company: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      website: data.website,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  companies: async (
    _: any,
    { limit = 50, offset = 0 }: { limit?: number; offset?: number },
    context: GraphQLContext
  ) => {
    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_companies')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new GraphQLError(error.message)
    }

    return (data || []).map((company: any) => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      website: company.website,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    }))
  },

  conversation: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_conversations')
      .select(`
        *,
        crm_customers (
          id,
          email,
          first_name,
          last_name,
          instagram_username,
          enrichment_data,
          total_orders,
          total_spent
        ),
        crm_conversation_tags (
          tag:crm_tags (
            id,
            name,
            color
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    const customer = data.crm_customers
    const tags = (data.crm_conversation_tags || []).map((ct: any) => ct.tag).filter(Boolean)

    return {
      id: data.id,
      customerId: data.customer_id,
      platform: data.platform,
      status: data.status,
      isStarred: data.is_starred,
      unreadCount: data.unread_count,
      lastMessageAt: data.last_message_at,
      customer: customer ? {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: null,
        instagramUsername: customer.instagram_username,
        totalOrders: customer.total_orders,
        totalSpent: customer.total_spent?.toString(),
        enrichmentData: customer.enrichment_data,
        createdAt: null,
        updatedAt: null,
      } : null,
      tags,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  conversations: async (
    _: any,
    { platform, status, limit = 50 }: { platform?: string; status?: string; limit?: number },
    context: GraphQLContext
  ) => {
    const supabase = getSupabase(context)
    
    let query = supabase
      .from('crm_conversations')
      .select(`
        *,
        crm_customers (
          id,
          email,
          first_name,
          last_name,
          instagram_username,
          enrichment_data
        ),
        crm_conversation_tags (
          tag:crm_tags (
            id,
            name,
            color
          )
        )
      `)
      .order('last_message_at', { ascending: false })
      .limit(limit)

    if (platform) {
      query = query.eq('platform', platform)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new GraphQLError(error.message)
    }

    return (data || []).map((conv: any) => {
      const customer = conv.crm_customers
      const tags = (conv.crm_conversation_tags || []).map((ct: any) => ct.tag).filter(Boolean)

      return {
        id: conv.id,
        customerId: conv.customer_id,
        platform: conv.platform,
        status: conv.status,
        isStarred: conv.is_starred,
        unreadCount: conv.unread_count,
        lastMessageAt: conv.last_message_at,
        customer: customer ? {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: null,
          instagramUsername: customer.instagram_username,
          totalOrders: customer.total_orders,
          totalSpent: customer.total_spent?.toString(),
          enrichmentData: customer.enrichment_data,
          createdAt: null,
          updatedAt: null,
        } : null,
        tags,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      }
    })
  },

  messages: async (
    _: any,
    { conversationId }: { conversationId: string },
    context: GraphQLContext
  ) => {
    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new GraphQLError(error.message)
    }

    return (data || []).map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      direction: msg.direction,
      content: msg.content,
      metadata: msg.metadata,
      threadId: msg.thread_id,
      parentMessageId: msg.parent_message_id,
      threadDepth: msg.thread_depth,
      threadOrder: msg.thread_order,
      createdAt: msg.created_at,
    }))
  },

  tags: async (_: any, __: any, context: GraphQLContext) => {
    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw new GraphQLError(error.message)
    }

    return (data || []).map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }))
  },
}

// Mutation Resolvers
export const mutationResolvers = {
  createPerson: async (
    _: any,
    { input }: { input: any },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_customers')
      .insert({
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        instagram_username: input.instagramUsername,
      })
      .select()
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      instagramUsername: data.instagram_username,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent?.toString(),
      enrichmentData: data.enrichment_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  updatePerson: async (
    _: any,
    { id, input }: { id: string; input: any },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const updateData: any = {}
    if (input.email !== undefined) updateData.email = input.email
    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.instagramUsername !== undefined) updateData.instagram_username = input.instagramUsername

    const { data, error } = await supabase
      .from('crm_customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      instagramUsername: data.instagram_username,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent?.toString(),
      enrichmentData: data.enrichment_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  deletePerson: async (
    _: any,
    { id }: { id: string },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const { error } = await supabase
      .from('crm_customers')
      .delete()
      .eq('id', id)

    if (error) {
      throw new GraphQLError(error.message)
    }

    return true
  },

  createCompany: async (
    _: any,
    { input }: { input: any },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        name: input.name,
        domain: input.domain,
        industry: input.industry,
        website: input.website,
      })
      .select()
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }

    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      website: data.website,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  createMessage: async (
    _: any,
    { input }: { input: any },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const { data, error } = await supabase
      .from('crm_messages')
      .insert({
        conversation_id: input.conversationId,
        content: input.content,
        direction: input.direction || 'outbound',
        metadata: input.metadata,
        parent_message_id: input.parentMessageId,
      })
      .select()
      .single()

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }

    return {
      id: data.id,
      conversationId: data.conversation_id,
      direction: data.direction,
      content: data.content,
      metadata: data.metadata,
      threadId: data.thread_id,
      parentMessageId: data.parent_message_id,
      threadDepth: data.thread_depth,
      threadOrder: data.thread_order,
      createdAt: data.created_at,
    }
  },

  addTagToConversation: async (
    _: any,
    { conversationId, tagId }: { conversationId: string; tagId: string },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const { error } = await supabase
      .from('crm_conversation_tags')
      .insert({
        conversation_id: conversationId,
        tag_id: tagId,
      })

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }

    // Return updated conversation
    return queryResolvers.conversation(_, { id: conversationId }, context)
  },

  removeTagFromConversation: async (
    _: any,
    { conversationId, tagId }: { conversationId: string; tagId: string },
    context: GraphQLContext
  ) => {
    if (!context.user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }

    const supabase = getSupabase(context)
    
    const { error } = await supabase
      .from('crm_conversation_tags')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('tag_id', tagId)

    if (error) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }

    // Return updated conversation
    return queryResolvers.conversation(_, { id: conversationId }, context)
  },
}

// Combined resolvers
export const crmResolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
}

