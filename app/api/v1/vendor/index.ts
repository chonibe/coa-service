import { NextApiResponse } from 'next'
import { withAuth, UserRole, AuthenticatedRequest } from '@/lib/api-middleware/auth'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  // Authenticate request for vendors
  const authResult = await withAuth(req, res, [UserRole.VENDOR])

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
        return handleVendorGet(req, res)
      
      case 'POST':
        return handleVendorPost(req, res)
      
      case 'PUT':
        return handleVendorPut(req, res)
      
      case 'DELETE':
        return handleVendorDelete(req, res)
      
      default:
        return res.status(405).json({ 
          error: 'Method Not Allowed',
          message: 'Unsupported HTTP method' 
        })
    }
  } catch (error) {
    console.error('Vendor API error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred' 
    })
  }
}

// Handle GET requests for vendor data
async function handleVendorGet(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { type } = req.query

  switch (type) {
    case 'products':
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', req.user?.id)

      if (productsError) {
        return res.status(400).json({ 
          error: 'Data Retrieval Failed',
          message: 'Could not fetch vendor products' 
        })
      }

      return res.status(200).json({ products })

    case 'dashboard':
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('vendor_dashboard')
        .select('*')
        .eq('vendor_id', req.user?.id)
        .single()

      if (dashboardError) {
        return res.status(400).json({ 
          error: 'Dashboard Retrieval Failed',
          message: 'Could not fetch vendor dashboard data' 
        })
      }

      return res.status(200).json({ dashboard: dashboardData })

    case 'payouts':
      const { data: payouts, error: payoutsError } = await supabase
        .from('vendor_payouts')
        .select('*')
        .eq('vendor_id', req.user?.id)

      if (payoutsError) {
        return res.status(400).json({ 
          error: 'Payouts Retrieval Failed',
          message: 'Could not fetch vendor payouts' 
        })
      }

      return res.status(200).json({ payouts })

    default:
      return res.status(400).json({ 
        error: 'Invalid Request',
        message: 'Unsupported data type requested' 
      })
  }
}

// Handle POST requests for vendor actions
async function handleVendorPost(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { action, payload } = req.body

  switch (action) {
    case 'CREATE_PRODUCT':
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          ...payload,
          vendor_id: req.user?.id
        })
        .select()

      if (productError) {
        return res.status(400).json({ 
          error: 'Product Creation Failed',
          message: 'Could not create new product' 
        })
      }

      return res.status(201).json({ 
        message: 'Product created successfully',
        product: newProduct[0] 
      })

    case 'UPDATE_PROFILE':
      const { data: updatedProfile, error: profileError } = await supabase
        .from('vendor_profiles')
        .update(payload)
        .eq('vendor_id', req.user?.id)
        .select()

      if (profileError) {
        return res.status(400).json({ 
          error: 'Profile Update Failed',
          message: 'Could not update vendor profile' 
        })
      }

      return res.status(200).json({ 
        message: 'Profile updated successfully',
        profile: updatedProfile[0] 
      })

    default:
      return res.status(400).json({ 
        error: 'Invalid Action',
        message: 'Unsupported vendor action' 
      })
  }
}

// Handle PUT requests for vendor updates
async function handleVendorPut(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { type, payload } = req.body

  switch (type) {
    case 'PRODUCT':
      const { data: updatedProduct, error: productUpdateError } = await supabase
        .from('products')
        .update(payload)
        .eq('vendor_id', req.user?.id)
        .eq('id', payload.id)
        .select()

      if (productUpdateError) {
        return res.status(400).json({ 
          error: 'Product Update Failed',
          message: 'Could not update product' 
        })
      }

      return res.status(200).json({ 
        message: 'Product updated successfully',
        product: updatedProduct[0] 
      })

    default:
      return res.status(400).json({ 
        error: 'Invalid Update Type',
        message: 'Unsupported update type' 
      })
  }
}

// Handle DELETE requests for vendor resources
async function handleVendorDelete(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { type, id } = req.body

  switch (type) {
    case 'PRODUCT':
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('vendor_id', req.user?.id)
        .eq('id', id)

      if (deleteError) {
        return res.status(400).json({ 
          error: 'Product Deletion Failed',
          message: 'Could not delete product' 
        })
      }

      return res.status(200).json({ 
        message: 'Product deleted successfully' 
      })

    default:
      return res.status(400).json({ 
        error: 'Invalid Deletion Type',
        message: 'Unsupported deletion type' 
      })
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
} 