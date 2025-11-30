/**
 * STONE3PL Native API Client
 * Direct integration with STONE3PL's tracking API
 * Based on STONE3PL API capabilities via ChinaDivision
 */

interface STONE3PLConfig {
  apiKey: string
  baseUrl?: string
}

export interface STONE3PLTrackingEvent {
  timestamp: string
  description: string
  location?: string
  city?: string
  country?: string
  state?: string
  facility?: string
  status?: string
  parsedTime?: {
    date: string
    time: string
    relative: string
    full: string
    stone3plFormat?: string
  }
}

export interface STONE3PLTrackingInfo {
  sys_order_id?: string
  tracking_number: string
  order_id?: string
  track_list?: Array<[string, string]> // [timestamp, event_description]
  track_status?: number
  track_status_name?: string
  error_code?: number
  error_msg?: string
  carrier?: string
  shipping_method?: string
  last_mile_tracking?: string
  [key: string]: any
}

interface STONE3PLTrackListResponse {
  code: number
  msg: string
  data: STONE3PLTrackingInfo[] | null
}

interface STONE3PLTrackResponse {
  code: number
  msg: string
  data: STONE3PLTrackingInfo | null
}

export class STONE3PLClient {
  private config: STONE3PLConfig

  constructor(config: STONE3PLConfig) {
    if (!config.apiKey) {
      throw new Error('STONE3PL API Key is required.')
    }
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.chinadivision.com',
    }
  }

  /**
   * Get tracking information for a single order
   * Uses ChinaDivision's order-track-list endpoint which provides STONE3PL tracking
   * @param orderId - The Platform Order No. (e.g., "#1000101", "1000101", or "1260A" - will be normalized)
   * @param trackingNumber - Optional tracking number to use as fallback
   */
  async getTracking(orderId: string, trackingNumber?: string): Promise<STONE3PLTrackingInfo> {
    const cleanedOrderId = orderId.trim()
    const isAlphanumeric = /^[A-Za-z]/.test(cleanedOrderId.replace(/^#/, ''))
    
    // For alphanumeric order IDs, try without # prefix first, then with # prefix
    // For numeric order IDs, always use # prefix
    const orderIdsToTry = isAlphanumeric && !cleanedOrderId.startsWith('#')
      ? [cleanedOrderId, `#${cleanedOrderId}`]
      : [cleanedOrderId.startsWith('#') ? cleanedOrderId : `#${cleanedOrderId}`]
    
    let lastError: Error | null = null
    
    for (const normalizedOrderId of orderIdsToTry) {
      console.log(`[STONE3PL] Fetching tracking for order: ${normalizedOrderId} (original: ${orderId})${trackingNumber ? `, tracking: ${trackingNumber}` : ''}`)

      try {
        // Use order-track-list API which is more reliable
        const url = new URL(`${this.config.baseUrl}/order-track-list`)
        url.searchParams.set('order_ids', normalizedOrderId)

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'apikey': this.config.apiKey,
            'User-Agent': 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          // Handle 404 gracefully - tracking might not be available yet
          if (response.status === 404) {
            console.log(`[STONE3PL] Tracking not found for order ${normalizedOrderId} (404) - trying next format if available`)
            lastError = new Error(`Tracking not found for order ${orderId}`)
            continue // Try next format
          }
          console.error(`[STONE3PL] HTTP error ${response.status}:`, errorText)
          throw new Error(`STONE3PL API error: ${response.status} ${response.statusText}`)
        }

        const data: STONE3PLTrackListResponse = await response.json()

        if (data.code !== 0) {
          // Handle case where order tracking doesn't exist yet
          if (data.code === 7004 || data.msg?.toLowerCase().includes('not found')) {
            console.log(`[STONE3PL] Tracking not found for order ${normalizedOrderId} (code: ${data.code}) - trying next format if available`)
            lastError = new Error(`Tracking not found for order ${orderId}`)
            continue // Try next format
          }
          throw new Error(`STONE3PL API error: ${data.msg} (code: ${data.code})`)
        }

        if (!data.data || data.data.length === 0) {
          console.log(`[STONE3PL] No tracking data for order ${normalizedOrderId} - trying next format if available`)
          lastError = new Error(`Tracking not found for order ${orderId}`)
          continue // Try next format
        }

        // Success! Return the first tracking result
        return data.data[0]
      } catch (error: any) {
        // If it's a "not found" error, try the next format
        if (error.message?.includes('not found') || error.message?.includes('Tracking not found')) {
          lastError = error
          continue
        }
        // For other errors, throw immediately
        throw error
      }
    }
    
    // All formats failed
    if (lastError) {
      throw lastError
    }
    throw new Error(`Tracking not found for order ${orderId}`)
  }

  /**
   * Get tracking information for multiple orders (batch)
   * Uses ChinaDivision's order-track-list endpoint which provides STONE3PL tracking
   * @param orderIds - Array of Platform Order Nos. (e.g., ["#1000101", "#1000102"] or ["1000101", "1000102"])
   * @returns Array of tracking information
   */
  async getTrackings(orderIds: string[]): Promise<STONE3PLTrackingInfo[]> {
    if (!orderIds || orderIds.length === 0) {
      return []
    }

    // STONE3PL API limit is 40 orders per request
    if (orderIds.length > 40) {
      console.warn(`[STONE3PL] Requested ${orderIds.length} orders, but API limit is 40. Processing first 40.`)
      orderIds = orderIds.slice(0, 40)
    }

    // Normalize order IDs: ensure they have # prefix if they're numbers
    const normalizedOrderIds = orderIds.map(id => 
      id.startsWith('#') 
        ? id 
        : /^\d+$/.test(id.trim()) 
          ? `#${id.trim()}`
          : id
    )

    // Format order IDs as comma-delimited string
    const orderIdsParam = normalizedOrderIds.join(',')

    const url = `${this.config.baseUrl}/order-track-list?order_ids=${encodeURIComponent(orderIdsParam)}`
    
    console.log(`[STONE3PL] Fetching tracking for ${orderIds.length} orders`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.config.apiKey,
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 5.01; Windows NT 5.0)',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[STONE3PL] HTTP error ${response.status}:`, errorText)
      throw new Error(`STONE3PL API error: ${response.status} ${response.statusText}`)
    }

    const data: STONE3PLTrackListResponse = await response.json()

    if (data.code !== 0) {
      throw new Error(`STONE3PL API error: ${data.msg} (code: ${data.code})`)
    }

    if (!data.data || !Array.isArray(data.data)) {
      console.warn(`[STONE3PL] No tracking data returned for orders: ${orderIdsParam}`)
      return []
    }

    console.log(`[STONE3PL] Successfully fetched tracking for ${data.data.length} orders`)
    return data.data
  }

  /**
   * Format timestamp into readable format with relative time
   * STONE3PL format: "Sep 14,2025 14:39 pm"
   */
  private formatTimestamp(timestamp: string): {
    date: string
    time: string
    relative: string
    full: string
    stone3plFormat: string // Format like "Sep 14,2025 14:39 pm"
  } {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      let relative = ''
      if (diffMins < 1) {
        relative = 'Just now'
      } else if (diffMins < 60) {
        relative = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else if (diffDays < 7) {
        relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      } else {
        relative = date.toLocaleDateString()
      }

      // STONE3PL format: "Sep 14,2025 14:39 pm" (no space after comma, lowercase pm/am)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = monthNames[date.getMonth()]
      const day = date.getDate()
      const year = date.getFullYear()
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'pm' : 'am'
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, '0')
      const stone3plFormat = `${month} ${day},${year} ${displayHours}:${displayMinutes} ${ampm}`

      return {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        relative,
        full: date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        stone3plFormat,
      }
    } catch (e) {
      return {
        date: timestamp,
        time: '',
        relative: timestamp,
        full: timestamp,
        stone3plFormat: timestamp,
      }
    }
  }

  /**
   * Parse tracking events from track_list into structured format
   * @param trackList - Array of [timestamp, description] tuples
   * @returns Array of structured tracking events
   */
  parseTrackingEvents(trackList?: Array<[string, string]>): STONE3PLTrackingEvent[] {
    if (!trackList || !Array.isArray(trackList)) {
      return []
    }

    return trackList.map(([timestamp, description]) => {
      const locationData = this.extractLocation(description)
      const parsedTime = this.formatTimestamp(timestamp)

      return {
        timestamp,
        description,
        location: locationData.location,
        city: locationData.city,
        country: locationData.country,
        state: locationData.state,
        facility: locationData.facility,
        status: this.extractStatus(description),
        parsedTime,
      }
    })
  }

  /**
   * Get tracking status information
   * @param trackStatus - Status code from API
   * @returns Status information object
   */
  getStatusInfo(trackStatus?: number): {
    code: number
    name: string
    description: string
    isDelivered: boolean
    isInTransit: boolean
    isException: boolean
  } {
    const statusMap: Record<number, { name: string; description: string }> = {
      0: { name: 'To be updated', description: 'Tracking information is pending' },
      101: { name: 'In Transit', description: 'Package is in transit' },
      111: { name: 'Pick Up', description: 'Package has been picked up' },
      112: { name: 'Out For Delivery', description: 'Package is out for delivery' },
      121: { name: 'Delivered', description: 'Package has been delivered' },
      131: { name: 'Alert', description: 'There is an alert with this shipment' },
      132: { name: 'Expired', description: 'Tracking has expired' },
    }

    const status = trackStatus !== undefined ? statusMap[trackStatus] : null

    return {
      code: trackStatus || 0,
      name: status?.name || 'Unknown',
      description: status?.description || 'Status unknown',
      isDelivered: trackStatus === 121,
      isInTransit: trackStatus === 101 || trackStatus === 111 || trackStatus === 112,
      isException: trackStatus === 131 || trackStatus === 132,
    }
  }

  /**
   * Extract location from tracking description
   * Enhanced parsing for STONE3PL format which often includes:
   * - "Mainland China, CN Shipment is in transit to next facility"
   * - "City, State Arrived at origin facility"
   * - Location names with country codes
   */
  private extractLocation(description: string): {
    location?: string
    city?: string
    country?: string
    state?: string
    facility?: string
  } {
    const result: {
      location?: string
      city?: string
      country?: string
      state?: string
      facility?: string
    } = {}

    // Pattern 1: "City State Description" (e.g., "Needham MA Delivered", "New York NY Gateway transit")
    const cityStatePattern = /^([A-Za-z\s]+?)\s+([A-Z]{2})\s+(.+)$/
    const cityStateMatch = description.match(cityStatePattern)
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim()
      result.state = cityStateMatch[2].trim()
      result.location = `${cityStateMatch[1].trim()} ${cityStateMatch[2].trim()}`
      result.facility = cityStateMatch[3].trim()
      return result
    }

    // Pattern 2: "Country, CountryCode Description" (e.g., "Mainland China, CN Shipment...")
    const countryPattern = /^([^,]+),\s*([A-Z]{2})\s+(.+)$/i
    const countryMatch = description.match(countryPattern)
    if (countryMatch) {
      result.country = countryMatch[1].trim()
      result.location = `${countryMatch[1].trim()}, ${countryMatch[2]}`
      result.facility = countryMatch[3].trim()
      return result
    }

    // Pattern 3: "City, State Description" (e.g., "Los Angeles, CA Arrived at...")
    const cityStateCommaPattern = /^([^,]+),\s*([A-Z]{2})\s+(.+)$/i
    const cityStateCommaMatch = description.match(cityStateCommaPattern)
    if (cityStateCommaMatch) {
      result.city = cityStateCommaMatch[1].trim()
      result.state = cityStateCommaMatch[2].trim()
      result.location = `${cityStateCommaMatch[1].trim()} ${cityStateCommaMatch[2].trim()}`
      result.facility = cityStateCommaMatch[3].trim()
      return result
    }

    // Pattern 4: "City, Country Description"
    const cityCountryPattern = /^([^,]+),\s*([^,]+)\s+(.+)$/i
    const cityCountryMatch = description.match(cityCountryPattern)
    if (cityCountryMatch) {
      result.city = cityCountryMatch[1].trim()
      result.country = cityCountryMatch[2].trim()
      result.location = `${cityCountryMatch[1].trim()}, ${cityCountryMatch[2].trim()}`
      result.facility = cityCountryMatch[3].trim()
      return result
    }

    // Pattern 5: "at [Location]" or "from [Location]" or "to [Location]"
    const atPattern = /(?:at|from|to|in)\s+([^,]+(?:,\s*[^,]+)?)/i
    const atMatch = description.match(atPattern)
    if (atMatch) {
      result.location = atMatch[1].trim()
      // Try to split into city/country if comma-separated
      const parts = atMatch[1].split(',').map(p => p.trim())
      if (parts.length >= 2) {
        result.city = parts[0]
        result.country = parts.slice(1).join(', ')
      } else {
        result.location = parts[0]
      }
    }

    // Pattern 6: Facility names (sort facility, origin facility, destination facility, etc.)
    const facilityPattern = /(?:arrived at|departed from|in transit to|at)\s+(.+?)(?:\s+facility|$)/i
    const facilityMatch = description.match(facilityPattern)
    if (facilityMatch) {
      result.facility = facilityMatch[1].trim()
      if (!result.location) {
        result.location = facilityMatch[1].trim()
      }
    }

    return result
  }

  /**
   * Extract status from tracking description
   */
  private extractStatus(description: string): string | undefined {
    const statusKeywords = [
      'delivered',
      'in transit',
      'picked up',
      'out for delivery',
      'exception',
      'alert',
      'expired',
    ]

    const lowerDesc = description.toLowerCase()
    for (const keyword of statusKeywords) {
      if (lowerDesc.includes(keyword)) {
        return keyword
      }
    }

    return undefined
  }

  /**
   * Get formatted tracking timeline
   * @param tracking - Tracking information object
   * @returns Formatted timeline with events
   */
  getTrackingTimeline(tracking: STONE3PLTrackingInfo): {
    events: STONE3PLTrackingEvent[]
    currentStatus: {
      code: number
      name: string
      description: string
      isDelivered: boolean
      isInTransit: boolean
      isException: boolean
    }
    hasError: boolean
    errorMessage?: string
  } {
    const events = this.parseTrackingEvents(tracking.track_list)
    const currentStatus = this.getStatusInfo(tracking.track_status)
    const hasError = tracking.error_code !== undefined && tracking.error_code !== 0

    return {
      events: events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ), // Most recent first
      currentStatus,
      hasError,
      errorMessage: hasError ? tracking.error_msg : undefined,
    }
  }
}

/**
 * Create a STONE3PL client instance from environment variables
 * Uses ChinaDivision API which provides STONE3PL tracking
 */
export function createSTONE3PLClient(): STONE3PLClient {
  const apiKey = process.env.CHINADIVISION_API_KEY

  if (!apiKey) {
    throw new Error('CHINADIVISION_API_KEY environment variable is required for STONE3PL tracking')
  }

  return new STONE3PLClient({
    apiKey,
  })
}

