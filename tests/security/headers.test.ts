import { NextResponse } from "next/server";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/middleware/cors";

/** Plain request-shaped object to avoid NextRequest issues in Jest */
function createMockRequest(init: { url?: string; method?: string; headers?: HeadersInit } = {}) {
  const url = init.url ?? "http://localhost:3000/api/test";
  return {
    url,
    nextUrl: new URL(url),
    method: init.method ?? "GET",
    headers: new Headers(init.headers ?? {}),
  } as any;
}

describe("Security Headers & CORS", () => {
  const mockUrl = "http://localhost:3000/api/test";

  it("should add correct security headers to responses", async () => {
    const request = createMockRequest({ url: mockUrl });
    const response = NextResponse.json({ success: true });

    const responseWithHeaders = addCorsHeaders(response, request);

    expect(responseWithHeaders.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("should allow configured origins", async () => {
    process.env.ALLOWED_ORIGINS = "https://trusted.com";
    const request = createMockRequest({
      url: mockUrl,
      headers: { origin: "https://trusted.com" },
    });
    const response = NextResponse.json({ success: true });

    const responseWithHeaders = addCorsHeaders(response, request);
    expect(responseWithHeaders.headers.get("Access-Control-Allow-Origin")).toBe("https://trusted.com");
  });

  it("should block untrusted origins in preflight", async () => {
    process.env.ALLOWED_ORIGINS = "https://trusted.com";
    const request = createMockRequest({
      url: mockUrl,
      method: "OPTIONS",
      headers: { origin: "https://malicious.com" },
    });

    const preflightResponse = handleCorsPreflight(request);
    expect(preflightResponse?.status).toBe(403);
  });
});

