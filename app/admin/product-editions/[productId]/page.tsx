import { createClient } from '@/lib/supabase/server'
import ProductDetails from './ProductDetails'

async function getProductData(
  productId: string, 
  page: number = 1, 
  pageSize: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  filters: {
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    hasEditionNumber?: boolean;
  } = {}
) {
  const supabase = createClient()
  
  // Fetch product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .single()

  if (productError) {
    throw new Error('Error loading product details')
  }

  // Calculate pagination
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  // Build query for line items
  let query = supabase
    .from('order_line_items')
    .select('*', { count: 'exact' })
    .eq('product_id', productId)

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.hasEditionNumber) {
    query = query.not('edition_number', 'is', null)
  }

  // Apply sorting and pagination
  const { data: lineItems, error: lineItemsError, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(start, end)

  if (lineItemsError) {
    throw new Error('Error loading line items')
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return { 
    product, 
    lineItems, 
    totalPages, 
    currentPage: page,
    totalItems: count || 0
  }
}

export default async function ProductDetailsPage({
  params,
  searchParams
}: {
  params: { productId: string }
  searchParams: { 
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
    minPrice?: string
    maxPrice?: string
    hasEditionNumber?: string
  }
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const pageSize = searchParams.pageSize ? parseInt(searchParams.pageSize) : 10
  const sortBy = searchParams.sortBy || 'created_at'
  const sortOrder = searchParams.sortOrder || 'desc'
  
  const filters = {
    status: searchParams.status,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    hasEditionNumber: searchParams.hasEditionNumber === 'true'
  }

  const data = await getProductData(
    params.productId, 
    page, 
    pageSize, 
    sortBy, 
    sortOrder as 'asc' | 'desc',
    filters
  )

  return <ProductDetails data={data} productId={params.productId} />
}
