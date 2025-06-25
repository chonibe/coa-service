import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Define user roles
export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  GUEST = 'guest'
}

// Authentication middleware interface
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

// Helper function to extract token from request
function extractToken(req: NextApiRequest): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookies (server-side)
  const cookies = req.headers.cookie?.split('; ') || []
  const tokenCookie = cookies.find(cookie => cookie.startsWith('sb-access-token='))
  
  return tokenCookie 
    ? tokenCookie.split('=')[1] 
    : null
}

// Middleware to verify JWT and extract user information
export async function withAuth(
  req: AuthenticatedRequest, 
  res: NextApiResponse, 
  requiredRoles: UserRole[] = []
) {
  // Extract JWT 
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication token is missing' 
    })
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token' 
      })
    }

    // Fetch user role from database
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !roleData) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'User role could not be determined' 
      })
    }

    // Check role-based access
    const userRole = roleData.role as UserRole
    if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      })
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: userRole
    }

    return true
  } catch (err) {
    console.error('Authentication error:', err)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication process failed' 
    })
  }
}

// Helper function to create role-specific middleware
export function requireRole(...roles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: NextApiResponse, next: () => void) => {
    const authResult = await withAuth(req, res, roles)
    if (authResult === true) {
      next()
    }
  }
}

// Example usage in API routes
export const config = {
  api: {
    bodyParser: true,
  },
} 