/**
 * ChinaDivision API Client
 * Handles all interactions with the ChinaDivision warehouse fulfillment API
 */

interface ChinaDivisionConfig {
  apiKey: string
  baseUrl?: string
}

interface ChinaDivisionOrderInfo {
  order_id: string
  order_detail_id?: string
  sys_order_id?: string
  first_name: string
  last_name: string
  ship_address1: string
  ship_address2?: string
  ship_city: string
  ship_state: string
  ship_zip: string
  ship_country: string
  ship_phone: string
  ship_email: string
  code: string
  quantity: string
  remark?: string
  date_added: string
  info: Array<{
    sku: string
    sku_code: string
    quantity: string
    tracking_number?: string
    shipping_method?: string
    package_number?: string
    product_name: string
    product_url?: string
    color?: string
    size?: string
    category?: string
    supplier?: string
  }>
  freight?: string
  tracking_number?: string
  last_mile_tracking?: string
  shipping_method?: string
  order_status?: number
  order_detail_status?: string | number
  order_deduction_status?: number
  carrier?: string
  status?: number
  status_name?: string
  track_status?: number
  track_status_name?: string
}

interface ChinaDivisionOrderResponse {
  code: number
  msg: string
  data: ChinaDivisionOrderInfo | null
}

interface ChinaDivisionOrdersResponse {
  code: number
  msg: string
  data: ChinaDivisionOrderInfo[] | null
}

interface ChinaDivisionTrackResponse {
  code: number
  msg: string
  data: {
    tracking_number?: string
    last_mile_tracking?: string
    track_status?: number
    track_status_name?: string
    carrier?: string
    shipping_method?: string
    [key: string]: any
  } | null
}

interface OrderTrackListItem {
  sys_order_id: string
  tracking_number: string
  order_id: string
  track_list: Array<[string, string]> // [timestamp, status_message]
  track_status: number
  track_status_name: string
  error_code: number
  error_msg: string
}

interface ChinaDivisionOrderTrackListResponse {
  code: number
  msg: string
  data: OrderTrackListItem[]
}

export class ChinaDivisionClient {
  private config: ChinaDivisionConfig

  constructor(config: ChinaDivisionConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.chinadivision.com',
    }
  }

  /**
   * Get a single order's information
   * @param orderId - The order ID from ChinaDivision
   */
  async getOrderInfo(orderId: string): Promise<ChinaDivisionOrderInfo> {
    const response = await fetch(`${this.config.baseUrl}/order-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey,
      },
      body: JSON.stringify({ order_id: orderId }),
    })

    if (!response.ok) {
      throw new Error(`ChinaDivision API error: ${response.status} ${response.statusText}`)
    }

    const data: ChinaDivisionOrderResponse = await response.json()

    if (data.code !== 0) {
      throw new Error(`ChinaDivision API error: ${data.msg} (code: ${data.code})`)
    }

    if (!data.data) {
      throw new Error('No order data returned from ChinaDivision API')
    }

    return data.data
  }

  /**
   * Get multiple orders within a date range
   * @param start - Start date (format: YYYY-MM-DD)
   * @param end - End date (format: YYYY-MM-DD)
   * @param fetchAllPages - If true, fetches all pages of results (default: true)
   */
  async getOrdersInfo(start: string, end: string, fetchAllPages: boolean = true): Promise<ChinaDivisionOrderInfo[]> {
    // According to API docs: GET method with URL parameters (not POST with body)
    // URL format: https://api.chinadivision.com/orders-info?page=1&page_size=250&start=2019-01-01&end=2019-01-31
    const baseUrl = `${this.config.baseUrl}/orders-info`
    const pageSize = 250 // Max page size to get more orders per request
    
    console.log(`[ChinaDivision] Fetching orders using GET method with URL parameters`)
    console.log(`[ChinaDivision] Date range: ${start} to ${end}`)
    console.log(`[ChinaDivision] API Key: ${this.config.apiKey ? 'Set' : 'Missing'}`)
    
    // Build URL with query parameters for first page
    const url = `${baseUrl}?page=1&page_size=${pageSize}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.config.apiKey,
      },
    })

    const responseText = await response.text()
    console.log(`[ChinaDivision] Response status: ${response.status}`)
    console.log(`[ChinaDivision] Response text:`, responseText.substring(0, 500))

    if (!response.ok) {
      console.error(`[ChinaDivision] HTTP error ${response.status}:`, responseText)
      throw new Error(`ChinaDivision API error: ${response.status} ${response.statusText}`)
    }

    let data: ChinaDivisionOrdersResponse
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error(`[ChinaDivision] JSON parse error:`, parseError)
      throw new Error(`Invalid JSON response from ChinaDivision API: ${responseText.substring(0, 200)}`)
    }

    console.log(`[ChinaDivision] API response:`, { 
      code: data.code, 
      msg: data.msg, 
      dataType: typeof data.data,
      isArray: Array.isArray(data.data),
      hasOrderInfos: data.data && typeof data.data === 'object' && 'order_infos' in data.data
    })

    if (data.code !== 0) {
      console.error(`[ChinaDivision] API error code ${data.code}:`, data.msg)
      throw new Error(`ChinaDivision API error: ${data.msg} (code: ${data.code})`)
    }

    // Handle different response structures
    let orders: ChinaDivisionOrderInfo[] = []
    
    if (Array.isArray(data.data)) {
      // Direct array response (legacy format)
      orders = data.data
    } else if (data.data && typeof data.data === 'object' && 'order_infos' in data.data) {
      // Paginated response with order_infos
      const responseData = data.data as { 
        order_infos?: any[], 
        page?: number, 
        page_count?: number, 
        order_count?: string | number 
      }
      const rawOrders = Array.isArray(responseData.order_infos) ? responseData.order_infos : []
      const totalPages = responseData.page_count || 1
      const currentPage = responseData.page || 1
      const totalOrders = typeof responseData.order_count === 'string' ? parseInt(responseData.order_count) : (responseData.order_count || rawOrders.length)
      
      console.log(`[ChinaDivision] Found ${rawOrders.length} orders in page ${currentPage} of ${totalPages} (total: ${totalOrders})`)
      
      // Log detailed status distribution for this page to debug missing shipped orders
      const pageStatusCounts = rawOrders.reduce((acc: any, order: any) => {
        const status = order.status !== undefined ? order.status : 'undefined'
        const orderStatus = order.order_status !== undefined ? order.order_status : 'undefined'
        const trackStatus = order.track_status !== undefined ? order.track_status : 'undefined'
        const key = `status:${status}, order_status:${orderStatus}, track_status:${trackStatus}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      console.log(`[ChinaDivision] Page ${currentPage} status breakdown (first 10):`, Object.entries(pageStatusCounts).slice(0, 10))
      
      // Log sample orders to see what status fields they have
      if (rawOrders.length > 0) {
        const sampleOrder = rawOrders[0]
        console.log(`[ChinaDivision] Sample order status fields:`, {
          status: sampleOrder.status,
          status_name: sampleOrder.status_name,
          order_status: sampleOrder.order_status,
          track_status: sampleOrder.track_status,
          track_status_name: sampleOrder.track_status_name,
          order_id: sampleOrder.order_id,
          sys_order_id: sampleOrder.sys_order_id,
          date_added: sampleOrder.date_added,
        })
        
        // Log any orders with status 3 (shipped) if found
        const shippedOrders = rawOrders.filter((o: any) => o.status === 3 || o.order_status === 1)
        if (shippedOrders.length > 0) {
          console.log(`[ChinaDivision] Found ${shippedOrders.length} shipped orders in page ${currentPage}:`, shippedOrders.slice(0, 3).map((o: any) => ({
            order_id: o.order_id,
            sys_order_id: o.sys_order_id,
            status: o.status,
            order_status: o.order_status,
            track_status: o.track_status,
          })))
        }
      }
      
      // Map the orders to our interface format (handle different field names from API)
      // Preserve the original order_id (Platform Order No.) and sys_order_id (System Order ID) separately
      orders = rawOrders.map((order: any) => ({
        order_id: order.order_id || '', // Platform Order No. - preserve original from API
        order_detail_id: order.order_detail_id,
        sys_order_id: order.sys_order_id, // System Order ID - unique identifier
        first_name: order.first_name || '',
        last_name: order.last_name || '',
        ship_address1: order.ship_address1 || '',
        ship_address2: order.ship_address2,
        ship_city: order.ship_city || '',
        ship_state: order.ship_state || '',
        ship_zip: order.ship_zip || '',
        ship_country: order.ship_country || '',
        ship_phone: order.ship_phone || '',
        ship_email: order.ship_email || '',
        code: order.code,
        quantity: order.quantity,
        remark: order.remark,
        date_added: order.date_added || order.created_at || new Date().toISOString(),
        order_detail_status: order.order_detail_status,
        info: order.info || [],
        freight: order.freight,
        tracking_number: order.tracking_number,
        last_mile_tracking: order.last_mile_tracking,
        shipping_method: order.shipping_method,
        order_status: order.order_status,
        order_deduction_status: order.order_deduction_status,
        carrier: order.carrier,
        status: order.status,
        status_name: order.status_name,
        track_status: order.track_status,
        track_status_name: order.track_status_name,
        ...order, // Include any additional fields
      }))
      
      // Fetch remaining pages if needed and fetchAllPages is true
      // Always fetch all pages if there are multiple pages, regardless of currentPage
      if (fetchAllPages && totalPages > 1) {
        console.log(`[ChinaDivision] Total pages: ${totalPages}, Current page: ${currentPage}, Fetching remaining ${totalPages - 1} pages...`)
        for (let page = 2; page <= totalPages; page++) {
          try {
            console.log(`[ChinaDivision] Fetching page ${page} of ${totalPages}...`)
            // Use GET with URL parameters for pagination
            const pageUrl = `${baseUrl}?page=${page}&page_size=${pageSize}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
            const pageResponse = await fetch(pageUrl, {
              method: 'GET',
              headers: {
                'apikey': this.config.apiKey,
              },
            })
            
            const pageText = await pageResponse.text()
            console.log(`[ChinaDivision] Page ${page} response status: ${pageResponse.status}`)
            
            if (pageResponse.ok) {
              const pageData: ChinaDivisionOrdersResponse = JSON.parse(pageText)
              console.log(`[ChinaDivision] Page ${page} response code: ${pageData.code}, has data: ${!!pageData.data}`)
              
              if (pageData.code === 0 && pageData.data && typeof pageData.data === 'object' && 'order_infos' in pageData.data) {
                const pageResponseData = pageData.data as { order_infos?: any[], page?: number, page_count?: number }
                const pageRawOrders = Array.isArray(pageResponseData.order_infos) ? pageResponseData.order_infos : []
                console.log(`[ChinaDivision] Page ${page} has ${pageRawOrders.length} orders in order_infos`)
                
                const pageMappedOrders = pageRawOrders.map((order: any) => ({
                  order_id: order.order_id || '', // Platform Order No. - preserve original from API
                  order_detail_id: order.order_detail_id,
                  sys_order_id: order.sys_order_id, // System Order ID - unique identifier
                  first_name: order.first_name || '',
                  last_name: order.last_name || '',
                  ship_address1: order.ship_address1 || '',
                  ship_address2: order.ship_address2,
                  ship_city: order.ship_city || '',
                  ship_state: order.ship_state || '',
                  ship_zip: order.ship_zip || '',
                  ship_country: order.ship_country || '',
                  ship_phone: order.ship_phone || '',
                  ship_email: order.ship_email || '',
                  code: order.code,
                  quantity: order.quantity,
                  remark: order.remark,
                  date_added: order.date_added || order.created_at || new Date().toISOString(),
                  order_detail_status: order.order_detail_status,
                  info: order.info || [],
                  freight: order.freight,
                  tracking_number: order.tracking_number,
                  last_mile_tracking: order.last_mile_tracking,
                  shipping_method: order.shipping_method,
                  order_status: order.order_status,
                  order_deduction_status: order.order_deduction_status,
                  carrier: order.carrier,
                  status: order.status,
                  status_name: order.status_name,
                  track_status: order.track_status,
                  track_status_name: order.track_status_name,
                  ...order,
                }))
                orders = [...orders, ...pageMappedOrders]
                console.log(`[ChinaDivision] Fetched page ${page}: ${pageMappedOrders.length} orders (total so far: ${orders.length})`)
              } else {
                console.warn(`[ChinaDivision] Page ${page} response doesn't have expected structure:`, {
                  code: pageData.code,
                  hasData: !!pageData.data,
                  dataType: typeof pageData.data,
                  hasOrderInfos: pageData.data && typeof pageData.data === 'object' && 'order_infos' in pageData.data
                })
              }
            } else {
              console.error(`[ChinaDivision] Page ${page} HTTP error ${pageResponse.status}:`, pageText.substring(0, 200))
            }
          } catch (pageError: any) {
            console.error(`[ChinaDivision] Error fetching page ${page}:`, pageError.message || pageError)
            // Continue with other pages even if one fails
          }
        }
        console.log(`[ChinaDivision] Finished fetching all pages. Total orders collected: ${orders.length}`)
      }
    } else if (data.data === null || data.data === undefined) {
      orders = []
    }

    // TEMPORARILY: Don't skip duplicates - return all orders as-is to see all statuses
    // The API seems to be filtering by status, so we need to see all order details
    console.log(`[ChinaDivision] Returning all ${orders.length} order details without deduplication to see all statuses`)
    
    // Log detailed status distribution
    const statusCounts = orders.reduce((acc: any, order: any) => {
      const status = order.status !== undefined ? order.status : 'undefined'
      const statusName = order.status_name || 'unknown'
      const key = `${status} (${statusName})`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    console.log(`[ChinaDivision] Status distribution (all order details):`, statusCounts)
    console.log(`[ChinaDivision] Shipped orders (status=3):`, orders.filter(o => o.status === 3).length)
    console.log(`[ChinaDivision] Canceled orders (status=23):`, orders.filter(o => o.status === 23).length)
    
    // Just return all orders without deduplication for now
    return orders
  }

  /**
   * Get order tracking information
   * @param orderId - The order ID from ChinaDivision
   */
  async getOrderTrack(orderId: string): Promise<ChinaDivisionTrackResponse['data']> {
    const response = await fetch(`${this.config.baseUrl}/order-track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey,
      },
      body: JSON.stringify({ order_id: orderId }),
    })

    if (!response.ok) {
      throw new Error(`ChinaDivision API error: ${response.status} ${response.statusText}`)
    }

    const data: ChinaDivisionTrackResponse = await response.json()

    if (data.code !== 0) {
      throw new Error(`ChinaDivision API error: ${data.msg} (code: ${data.code})`)
    }

    return data.data
  }

  /**
   * Get tracking information for multiple orders by customer order IDs
   * @param orderIds - Comma-delimited customer order IDs (e.g., "#1000101,#1000102")
   * @returns Array of tracking information for each order
   */
  async getOrderTrackList(orderIds: string): Promise<OrderTrackListItem[]> {
    // Validate order IDs format
    if (!orderIds || orderIds.trim().length === 0) {
      throw new Error('Order IDs cannot be empty')
    }

    // Check if exceeds 40 orders limit
    const orderIdArray = orderIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
    if (orderIdArray.length > 40) {
      throw new Error('Cannot request tracking for more than 40 orders at once')
    }

    // Build URL with order_ids parameter
    const url = new URL(`${this.config.baseUrl}/order-track-list`)
    url.searchParams.set('order_ids', orderIds)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'apikey': this.config.apiKey,
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`ChinaDivision API error: ${response.status} ${response.statusText}`)
    }

    const data: ChinaDivisionOrderTrackListResponse = await response.json()

    // Handle API error codes
    if (data.code !== 0) {
      const errorMessages: Record<number, string> = {
        1: 'Apikey can not be empty',
        2: 'Apikey does not exist',
        7001: 'Invalid order id',
        7002: 'Exceed 40 numbers',
        7003: 'Error order ids',
        7004: 'Not found order info',
        7005: 'Get track info fail',
      }

      const errorMessage = errorMessages[data.code] || data.msg
      throw new Error(`ChinaDivision API error: ${errorMessage} (code: ${data.code})`)
    }

    return data.data || []
  }

  /**
   * Get all SKU inventory from ChinaDivision
   * @returns Array of SKU inventory items
   */
  async getAllSkuInventory(): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/sku-inventory-all`, {
      method: 'GET',
      headers: {
        'apikey': this.config.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`ChinaDivision API error: ${response.status} ${response.statusText}`)
    }

    // Read response as text first to avoid "Body has already been read" error
    const responseText = await response.text()
    const data = JSON.parse(responseText)

    if (data.code !== 0) {
      throw new Error(`ChinaDivision API error: ${data.msg} (code: ${data.code})`)
    }

    return data.data || []
  }
}

/**
 * Create a ChinaDivision client instance from environment variables
 */
export function createChinaDivisionClient(): ChinaDivisionClient {
  const apiKey = process.env.CHINADIVISION_API_KEY

  if (!apiKey) {
    throw new Error(
      'ChinaDivision API key not configured. Set CHINADIVISION_API_KEY environment variable.'
    )
  }

  return new ChinaDivisionClient({
    apiKey,
  })
}

export type { 
  ChinaDivisionOrderInfo, 
  ChinaDivisionOrderResponse, 
  ChinaDivisionOrdersResponse, 
  ChinaDivisionTrackResponse,
  OrderTrackListItem,
  ChinaDivisionOrderTrackListResponse
}

