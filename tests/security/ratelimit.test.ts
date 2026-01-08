import { NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit";

// Mock the rate limiter to test middleware logic
jest.mock("@/lib/crm/rate-limiter", () => ({
  checkRateLimit: jest.fn(),
  getRateLimitHeaders: jest.fn(() => ({
    "X-RateLimit-Limit": "10",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "123456789"
  }))
}));

import { checkRateLimit } from "@/lib/crm/rate-limiter";

describe("Rate Limiting Middleware", () => {
  const mockUrl = "http://localhost:3000/api/auth/login";

  it("should return 429 when rate limit is exceeded", async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: false,
      retryAfter: 60
    });

    const request = new NextRequest(mockUrl, {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" }
    });

    const response = rateLimitMiddleware(request);
    
    expect(response?.status).toBe(429);
    const body = await response?.json();
    expect(body.error).toBe("Rate limit exceeded");
    expect(response?.headers.get("Retry-After")).toBe("60");
  });

  it("should allow request when within limits", () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 5
    });

    const request = new NextRequest(mockUrl, {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" }
    });

    const response = rateLimitMiddleware(request);
    expect(response).toBeNull(); // Middleware returns null to continue
  });
});

