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
   */
  async getOrdersInfo(start: string, end: string): Promise<ChinaDivisionOrderInfo[]> {
    const response = await fetch(`${this.config.baseUrl}/orders-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey,
      },
      body: JSON.stringify({ start, end }),
    })

    if (!response.ok) {
      throw new Error(`ChinaDivision API error: ${response.status} ${response.statusText}`)
    }

    const data: ChinaDivisionOrdersResponse = await response.json()

    if (data.code !== 0) {
      throw new Error(`ChinaDivision API error: ${data.msg} (code: ${data.code})`)
    }

    return data.data || []
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

