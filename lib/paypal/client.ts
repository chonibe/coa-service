/**
 * PayPal Client for OAuth authentication and API access
 * Handles token generation and refresh for PayPal Payouts API
 */

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  app_id: string
  expires_in: number
  nonce: string
}

interface PayPalClientConfig {
  clientId: string
  clientSecret: string
  baseUrl: string // 'https://api-m.sandbox.paypal.com' for sandbox or 'https://api-m.paypal.com' for production
}

class PayPalClient {
  private config: PayPalClientConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: PayPalClientConfig) {
    this.config = config
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Fetch new token
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')
    
    const response = await fetch(`${this.config.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PayPal authentication failed: ${response.status} ${errorText}`)
    }

    const data: PayPalTokenResponse = await response.json()
    
    this.accessToken = data.access_token
    // Set expiry to 5 minutes before actual expiry for safety
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

    return this.accessToken
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PayPal API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }
}

/**
 * Create a PayPal client instance from environment variables
 */
export function createPayPalClient(): PayPalClient {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const isProduction = process.env.PAYPAL_ENVIRONMENT === 'production'
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.')
  }

  const baseUrl = isProduction 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  return new PayPalClient({
    clientId,
    clientSecret,
    baseUrl,
  })
}

export { PayPalClient }
export type { PayPalClientConfig, PayPalTokenResponse }

