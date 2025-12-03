/**
 * API Client with Rate Limit Handling
 * Wraps fetch with automatic rate limit retry logic
 */

import { handleRateLimit } from "@/lib/crm/rate-limiter"

export interface ApiClientOptions {
  baseUrl?: string
  headers?: Record<string, string>
  retryOnRateLimit?: boolean
}

export class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>
  private retryOnRateLimit: boolean

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || ""
    this.headers = options.headers || {}
    this.retryOnRateLimit = options.retryOnRateLimit !== false
  }

  /**
   * Make a request with automatic rate limit handling
   */
  async request(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    }

    const requestFn = () => fetch(fullUrl, requestOptions)

    if (this.retryOnRateLimit) {
      return handleRateLimit(requestFn)
    }

    return requestFn()
  }

  /**
   * GET request
   */
  async get(url: string, options?: RequestInit): Promise<Response> {
    return this.request(url, { ...options, method: "GET" })
  }

  /**
   * POST request
   */
  async post(url: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * PUT request
   */
  async put(url: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * DELETE request
   */
  async delete(url: string, options?: RequestInit): Promise<Response> {
    return this.request(url, { ...options, method: "DELETE" })
  }
}

// Default client instance
export const apiClient = new ApiClient({
  retryOnRateLimit: true,
})

