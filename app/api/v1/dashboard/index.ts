import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth, UserRole, AuthenticatedRequest } from '@/lib/api-middleware/auth'
import { createClient } from '@/lib/supabase/server'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  // Authenticate request for customers and admins
  const authResult = await withAuth(req, res, [
    UserRole.CUSTOMER, 
    UserRole.ADMIN
  ])

  if (authResult !== true) {
    return
  }

  // Ensure user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'User authentication failed' 
    })
  }

  try {
    switch (req.method) {
      case 'GET':
        // Fetch dashboard data based on user role
        const dashboardData = await fetchDashboardData(req.user)
        return res.status(200).json(dashboardData)

      case 'POST':
        // Handle dashboard-related actions
        const actionResult = await handleDashboardAction(req)
        return res.status(200).json(actionResult)

      default:
        return res.status(405).json({ 
          error: 'Method Not Allowed',
          message: 'Only GET and POST methods are supported' 
        })
    }
  } catch (error) {
    console.error('Dashboard API error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred' 
    })
  }
}

// Fetch dashboard data based on user role and permissions
async function fetchDashboardData(user: NonNullable<AuthenticatedRequest['user']>) {
  switch (user.role) {
    case UserRole.CUSTOMER:
      // Fetch customer-specific dashboard data
      const { data: customerData, error: customerError } = await supabase
        .from('customer_dashboard')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (customerError) {
        throw new Error('Failed to fetch customer dashboard data')
      }

      return {
        user: {
          id: user.id,
          email: user.email
        },
        data: customerData
      }

    case UserRole.ADMIN:
      // Fetch admin dashboard overview
      const { data: adminData, error: adminError } = await supabase
        .from('admin_dashboard_overview')
        .select('*')
        .single()

      if (adminError) {
        throw new Error('Failed to fetch admin dashboard data')
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        data: adminData
      }

    default:
      throw new Error('Unsupported user role')
  }
}

// Handle dashboard-related actions
async function handleDashboardAction(req: AuthenticatedRequest) {
  const { action, payload } = req.body

  switch (action) {
    case 'UPDATE_PROFILE':
      // Example: Update user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('user_id', req.user?.id)

      if (error) {
        throw new Error('Failed to update profile')
      }

      return { 
        success: true, 
        message: 'Profile updated successfully' 
      }

    default:
      throw new Error('Unsupported dashboard action')
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
} 