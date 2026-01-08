import { NextRequest } from 'next/server'
import { checkRateLimit } from '../crm/rate-limiter'

describe('Rate Limiter Logic', () => {
  const userId = 'test-user-ip'
  
  beforeEach(() => {
    // We can't easily reset the internal Map in rate-limiter.ts
    // but we can use different user IDs
  })

  it('should allow requests within limit', () => {
    const config = {
      readLimit: 5,
      writeLimit: 2,
      windowMs: 10000
    }
    
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(`user-1-${i}`, 'GET', config)
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests exceeding limit', () => {
    const config = {
      readLimit: 2,
      writeLimit: 1,
      windowMs: 10000
    }
    const id = 'user-blocked'
    
    checkRateLimit(id, 'GET', config)
    checkRateLimit(id, 'GET', config)
    const result = checkRateLimit(id, 'GET', config)
    
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})

