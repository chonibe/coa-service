import { useState, useEffect, useCallback } from 'react'

// Centralized error handling
export class APIError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
  }
}

// Logging service (can be expanded to integrate with external logging)
const logError = (error: APIError) => {
  console.error('API Error:', {
    message: error.message,
    status: error.status,
    code: error.code,
    timestamp: new Date().toISOString()
  })

  // Potential integration with error tracking service
  // errorTrackingService.capture(error)
}

// Authentication token management
const getAuthToken = () => {
  // Implement secure token retrieval (e.g., from secure storage)
  return localStorage.getItem('auth_token')
}

// API request types
export type APIRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// Generic API fetch hook configuration
export interface APIFetchOptions<T = any> {
  method?: APIRequestMethod
  body?: any
  validate?: (data: any) => boolean
  immediate?: boolean
  cacheKey?: string
  retries?: number
}

// Caching mechanism
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useApiFetch<T = any>(
  endpoint: string, 
  options: APIFetchOptions<T> = {}
) {
  const {
    method = 'GET',
    body = null,
    validate,
    immediate = true,
    cacheKey,
    retries = 2
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<APIError | null>(null)

  // Check cache first
  const checkCache = useCallback(() => {
    if (cacheKey) {
      const cachedEntry = cache.get(cacheKey)
      if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_DURATION) {
        setData(cachedEntry.data)
        setLoading(false)
        return true
      }
    }
    return false
  }, [cacheKey])

  const fetchData = useCallback(async () => {
    // Check if already cached
    if (checkCache()) return

    // Reset state
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      })

      // Handle non-200 responses
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new APIError(
          errorBody.message || 'An unexpected error occurred', 
          response.status,
          errorBody.error
        )
      }

      const responseData = await response.json()

      // Custom validation if provided
      if (validate && !validate(responseData)) {
        throw new APIError(
          'Data validation failed', 
          400, 
          'VALIDATION_ERROR'
        )
      }

      // Cache the result if cache key is provided
      if (cacheKey) {
        cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now()
        })
      }

      setData(responseData)
      setLoading(false)

      return responseData
    } catch (err) {
      // Handle different error types
      const apiError = err instanceof APIError 
        ? err 
        : new APIError(
            err instanceof Error ? err.message : 'Unknown error', 
            500
          )

      // Log the error
      logError(apiError)

      // Implement retry mechanism
      if (retries > 0 && apiError.status !== 400 && apiError.status !== 401) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchData()
      }

      setError(apiError)
      setLoading(false)

      throw apiError
    }
  }, [endpoint, method, body, validate, cacheKey, retries])

  // Trigger immediate fetch if specified
  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [immediate, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    // Utility methods
    clearCache: () => {
      if (cacheKey) {
        cache.delete(cacheKey)
      }
    }
  }
}

// Predefined validation functions for common data types
export const validators = {
  vendor: (data: any) => 
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.email === 'string' &&
    ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(data.status),

  product: (data: any) => 
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.price === 'number' &&
    data.price > 0 &&
    typeof data.vendorId === 'string',

  order: (data: any) => 
    typeof data.id === 'string' &&
    typeof data.customerId === 'string' &&
    typeof data.total === 'number' &&
    data.total > 0 &&
    ['PENDING', 'COMPLETED', 'CANCELLED'].includes(data.status)
}

// Mutation hook for POST/PUT/DELETE operations
export function useApiMutation<T = any>(
  endpoint: string, 
  method: Exclude<APIRequestMethod, 'GET'> = 'POST'
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)
  const [data, setData] = useState<T | null>(null)

  const mutate = useCallback(async (payload: any) => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new APIError(
          errorBody.message || 'Mutation failed', 
          response.status,
          errorBody.error
        )
      }

      const responseData = await response.json()
      setData(responseData)
      setLoading(false)

      return responseData
    } catch (err) {
      const apiError = err instanceof APIError 
        ? err 
        : new APIError(
            err instanceof Error ? err.message : 'Unknown error', 
            500
          )

      logError(apiError)
      setError(apiError)
      setLoading(false)

      throw apiError
    }
  }, [endpoint, method])

  return {
    mutate,
    loading,
    error,
    data
  }
} 