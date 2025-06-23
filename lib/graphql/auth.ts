import { createClient } from '@supabase/supabase-js'
import { GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export enum UserRole {
  ARTIST = 'ARTIST',
  COLLECTOR = 'COLLECTOR',
  ADMIN = 'ADMIN'
}

export interface AuthContext {
  user: {
    id: string
    email: string
    role: UserRole
  } | null
}

export const createAuthContext = async (token?: string): Promise<AuthContext> => {
  if (!token) {
    return { user: null }
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string
      email: string
      role: UserRole
    }

    // Additional Supabase verification
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.sub)
      .single()

    if (error || !data) {
      throw new GraphQLError('Invalid user', {
        extensions: { code: 'UNAUTHENTICATED' }
      })
    }

    return {
      user: {
        id: data.id,
        email: data.email,
        role: data.role as UserRole
      }
    }
  } catch (err) {
    throw new GraphQLError('Authentication failed', {
      extensions: { 
        code: 'UNAUTHENTICATED',
        originalError: err instanceof Error ? err.message : 'Unknown error'
      }
    })
  }
}

export const requireAuth = (roles?: UserRole[]) => {
  return (resolver: any) => {
    return async (parent: any, args: any, context: AuthContext, info: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      if (roles && !roles.includes(context.user.role)) {
        throw new GraphQLError('Insufficient permissions', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      return resolver(parent, args, context, info)
    }
  }
}

export const authResolvers = {
  Query: {
    me: requireAuth()(async (_: any, __: any, context: AuthContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', context.user.id)
        .single()

      if (error) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return data
    })
  },

  Mutation: {
    updateProfile: requireAuth()((
      _: any, 
      { input }: { input: { name?: string } }, 
      context: AuthContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      return supabase
        .from('users')
        .update(input)
        .eq('id', context.user.id)
        .single()
    }),

    changeRole: requireAuth([UserRole.ADMIN])((
      _: any, 
      { userId, newRole }: { userId: string, newRole: UserRole }, 
      context: AuthContext
    ) => {
      return supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .single()
    })
  }
} 