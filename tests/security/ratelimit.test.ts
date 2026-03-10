// Mock next/server so NextResponse.json returns a Response with readable body in Jest
jest.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Headers }) => {
      return new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: init?.headers ?? new Headers(),
      });
    },
  },
}));

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

/** Plain request-shaped object to avoid NextRequest read-only url in Jest */
function createMockRequest(overrides: { pathname?: string; method?: string; headers?: HeadersInit } = {}) {
  const pathname = overrides.pathname ?? "/api/auth/login";
  return {
    nextUrl: new URL(`http://localhost:3000${pathname}`),
    method: overrides.method ?? "POST",
    headers: new Headers(overrides.headers ?? { "x-forwarded-for": "1.2.3.4" }),
  } as any;
}

describe("Rate Limiting Middleware", () => {
  it("should return 429 when rate limit is exceeded", async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: false,
      retryAfter: 60
    });

    const request = createMockRequest();

    const response = rateLimitMiddleware(request);

    expect(response?.status).toBe(429);
    const text = await response?.text();
    const body = text ? JSON.parse(text) : {};
    expect(body.error).toBe("Rate limit exceeded");
    expect(response?.headers.get("Retry-After")).toBe("60");
  });

  it("should allow request when within limits", () => {
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 5
    });

    const request = createMockRequest();

    const response = rateLimitMiddleware(request);
    expect(response).toBeNull(); // Middleware returns null to continue
  });
});

