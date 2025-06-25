import { NextApiRequest, NextApiResponse } from 'next'

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

// In-memory rate limiting store
class RateLimiter {
  private requestLog: Map<string, number[]> = new Map()

  // Clean up old request timestamps
  private cleanupRequestLog(ip: string, windowMs: number) {
    const now = Date.now()
    const requestLog = this.requestLog.get(ip) || []
    const filteredLog = requestLog.filter(timestamp => now - timestamp < windowMs)
    
    if (filteredLog.length === 0) {
      this.requestLog.delete(ip)
    } else {
      this.requestLog.set(ip, filteredLog)
    }
  }

  // Check if request is allowed
  public isAllowed(ip: string, config: RateLimitConfig): boolean {
    this.cleanupRequestLog(ip, config.windowMs)
    
    const requestLog = this.requestLog.get(ip) || []
    
    if (requestLog.length < config.maxRequests) {
      requestLog.push(Date.now())
      this.requestLog.set(ip, requestLog)
      return true
    }
    
    return false
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter()

// Default rate limit configurations
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests, please try again later.'
  },
  strict: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please wait before making more requests.'
  },
  lenient: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    message: 'Request limit reached.'
  }
}

// Extract client IP address
function getClientIp(req: NextApiRequest): string {
  const xForwardedFor = req.headers['x-forwarded-for']
  const remoteAddress = req.socket.remoteAddress

  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim()
  }

  return remoteAddress || 'unknown'
}

// Rate limiting middleware
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  config: RateLimitConfig = DEFAULT_CONFIGS.standard
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const clientIp = getClientIp(req)

    // Check if request is allowed
    if (!globalRateLimiter.isAllowed(clientIp, config)) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: config.message || 'Rate limit exceeded',
        retryAfter: Math.ceil(config.windowMs / 1000)
      })
    }

    // Continue to the original handler
    return handler(req, res)
  }
}

// Predefined rate limit configurations
export const RateLimitProfiles = {
  ...DEFAULT_CONFIGS,
  
  // Custom rate limit for specific endpoints
  adminActions: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: 'Administrative actions are strictly rate-limited.'
  },
  
  vendorOperations: {
    maxRequests: 50,
    windowMs: 60 * 1000,
    message: 'Vendor operations have a moderate rate limit.'
  }
}

// Decorator for easy rate limit application
export function RateLimit(config: RateLimitConfig = DEFAULT_CONFIGS.standard) {
  return function(
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function(req: NextApiRequest, res: NextApiResponse) {
      const clientIp = getClientIp(req)

      if (!globalRateLimiter.isAllowed(clientIp, config)) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil(config.windowMs / 1000)
        })
      }

      return originalMethod.apply(this, [req, res])
    }

    return descriptor
  }
} 