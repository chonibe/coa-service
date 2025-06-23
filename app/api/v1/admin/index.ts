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
  // Authenticate request for admins only
  const authResult = await withAuth(req, res, [UserRole.ADMIN])

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
        return handleAdminGet(req, res)
      
      case 'POST':
        return handleAdminPost(req, res)
      
      case 'PUT':
        return handleAdminPut(req, res)
      
      case 'DELETE':
        return handleAdminDelete(req, res)
      
      default:
        return res.status(405).json({ 
          error: 'Method Not Allowed',
          message: 'Unsupported HTTP method' 
        })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred' 
    })
  }
}

// Handle GET requests for admin data
async function handleAdminGet(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { type, page = 1, limit = 50 } = req.query

  // Pagination helper
  const calculatePagination = (page: number, limit: number) => ({
    from: (page - 1) * limit,
    to: page * limit - 1
  })

  const { from, to } = calculatePagination(Number(page), Number(limit))

  switch (type) {
    case 'VENDORS':
      const { data: vendors, count: vendorCount, error: vendorsError } = await supabase
        .from('vendors')
        .select('*', { count: 'exact' })
        .range(from, to)

      if (vendorsError) {
        return res.status(400).json({ 
          error: 'Data Retrieval Failed',
          message: 'Could not fetch vendors' 
        })
      }

      return res.status(200).json({ 
        vendors, 
        pagination: { 
          total: vendorCount, 
          page: Number(page), 
          limit: Number(limit) 
        } 
      })

    case 'ORDERS':
      const { data: orders, count: orderCount, error: ordersError } = await supabase
        .from('orders')
        .select('*, line_items(*)', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (ordersError) {
        return res.status(400).json({ 
          error: 'Data Retrieval Failed',
          message: 'Could not fetch orders' 
        })
      }

      return res.status(200).json({ 
        orders, 
        pagination: { 
          total: orderCount, 
          page: Number(page), 
          limit: Number(limit) 
        } 
      })

    case 'DASHBOARD':
      // Comprehensive admin dashboard metrics
      const dashboardMetrics = await Promise.all([
        supabase.from('total_sales').select('*').single(),
        supabase.from('active_vendors').select('*').single(),
        supabase.from('recent_orders').select('*').limit(10),
        supabase.from('product_performance').select('*').limit(10)
      ])

      return res.status(200).json({ 
        sales: dashboardMetrics[0].data,
        vendors: dashboardMetrics[1].data,
        recentOrders: dashboardMetrics[2].data,
        productPerformance: dashboardMetrics[3].data
      })

    case 'CERTIFICATES':
      const { data: certificates, count: certificateCount, error: certificatesError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact' })
        .range(from, to)

      if (certificatesError) {
        return res.status(400).json({ 
          error: 'Data Retrieval Failed',
          message: 'Could not fetch certificates' 
        })
      }

      return res.status(200).json({ 
        certificates, 
        pagination: { 
          total: certificateCount, 
          page: Number(page), 
          limit: Number(limit) 
        } 
      })

    default:
      return res.status(400).json({ 
        error: 'Invalid Request',
        message: 'Unsupported data type requested' 
      })
  }
}

// Handle POST requests for admin actions
async function handleAdminPost(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { action, payload } = req.body

  switch (action) {
    case 'CREATE_VENDOR':
      const { data: newVendor, error: vendorError } = await supabase
        .from('vendors')
        .insert(payload)
        .select()

      if (vendorError) {
        return res.status(400).json({ 
          error: 'Vendor Creation Failed',
          message: 'Could not create new vendor' 
        })
      }

      return res.status(201).json({ 
        message: 'Vendor created successfully',
        vendor: newVendor[0] 
      })

    case 'SYNC_SHOPIFY':
      // Trigger Shopify synchronization
      try {
        // Placeholder for Shopify sync logic
        const syncResult = await triggerShopifySync(payload)
        
        return res.status(200).json({ 
          message: 'Shopify sync initiated',
          result: syncResult 
        })
      } catch (syncError) {
        return res.status(500).json({ 
          error: 'Sync Failed',
          message: 'Could not complete Shopify synchronization' 
        })
      }

    case 'GENERATE_REPORT':
      const reportType = payload.type
      
      switch (reportType) {
        case 'SALES':
          const salesReport = await generateSalesReport(payload)
          return res.status(200).json(salesReport)
        
        case 'VENDOR_PERFORMANCE':
          const vendorReport = await generateVendorPerformanceReport(payload)
          return res.status(200).json(vendorReport)
        
        default:
          return res.status(400).json({ 
            error: 'Invalid Report Type',
            message: 'Unsupported report type' 
          })
      }

    default:
      return res.status(400).json({ 
        error: 'Invalid Action',
        message: 'Unsupported admin action' 
      })
  }
}

// Handle PUT requests for admin updates
async function handleAdminPut(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { type, payload } = req.body

  switch (type) {
    case 'VENDOR_STATUS':
      const { data: updatedVendor, error: vendorUpdateError } = await supabase
        .from('vendors')
        .update({ 
          status: payload.status 
        })
        .eq('id', payload.vendorId)
        .select()

      if (vendorUpdateError) {
        return res.status(400).json({ 
          error: 'Vendor Update Failed',
          message: 'Could not update vendor status' 
        })
      }

      return res.status(200).json({ 
        message: 'Vendor status updated successfully',
        vendor: updatedVendor[0] 
      })

    case 'CERTIFICATE':
      const { data: updatedCertificate, error: certificateUpdateError } = await supabase
        .from('certificates')
        .update(payload)
        .eq('id', payload.id)
        .select()

      if (certificateUpdateError) {
        return res.status(400).json({ 
          error: 'Certificate Update Failed',
          message: 'Could not update certificate' 
        })
      }

      return res.status(200).json({ 
        message: 'Certificate updated successfully',
        certificate: updatedCertificate[0] 
      })

    default:
      return res.status(400).json({ 
        error: 'Invalid Update Type',
        message: 'Unsupported update type' 
      })
  }
}

// Handle DELETE requests for admin resources
async function handleAdminDelete(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  const { type, id } = req.body

  switch (type) {
    case 'VENDOR':
      const { error: vendorDeleteError } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id)

      if (vendorDeleteError) {
        return res.status(400).json({ 
          error: 'Vendor Deletion Failed',
          message: 'Could not delete vendor' 
        })
      }

      return res.status(200).json({ 
        message: 'Vendor deleted successfully' 
      })

    case 'CERTIFICATE':
      const { error: certificateDeleteError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id)

      if (certificateDeleteError) {
        return res.status(400).json({ 
          error: 'Certificate Deletion Failed',
          message: 'Could not delete certificate' 
        })
      }

      return res.status(200).json({ 
        message: 'Certificate deleted successfully' 
      })

    default:
      return res.status(400).json({ 
        error: 'Invalid Deletion Type',
        message: 'Unsupported deletion type' 
      })
  }
}

// Helper function for Shopify sync (placeholder)
async function triggerShopifySync(payload: any) {
  // Implement actual Shopify sync logic
  return {
    status: 'PENDING',
    startedAt: new Date().toISOString()
  }
}

// Helper function for sales report generation
async function generateSalesReport(payload: any) {
  const { startDate, endDate } = payload

  const { data: salesData, error } = await supabase
    .from('sales')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    throw new Error('Could not generate sales report')
  }

  return {
    reportType: 'SALES',
    startDate,
    endDate,
    data: salesData,
    generatedAt: new Date().toISOString()
  }
}

// Helper function for vendor performance report
async function generateVendorPerformanceReport(payload: any) {
  const { vendorId, startDate, endDate } = payload

  const { data: performanceData, error } = await supabase
    .from('vendor_performance')
    .select('*')
    .eq('vendor_id', vendorId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    throw new Error('Could not generate vendor performance report')
  }

  return {
    reportType: 'VENDOR_PERFORMANCE',
    vendorId,
    startDate,
    endDate,
    data: performanceData,
    generatedAt: new Date().toISOString()
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
} 