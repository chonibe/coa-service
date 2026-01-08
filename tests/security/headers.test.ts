import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/middleware/cors";

describe("Security Headers & CORS", () => {
  const mockUrl = "http://localhost:3000/api/test";

  it("should add correct security headers to responses", async () => {
    // This would typically be tested via integration tests on the running server
    // Here we test the utility function
    const request = new NextRequest(mockUrl);
    const response = NextResponse.json({ success: true });
    
    const responseWithHeaders = addCorsHeaders(response, request);
    
    // Check for standard security headers (these are added in next.config.js usually,
    // but we can verify the CORS ones here)
    expect(responseWithHeaders.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("should allow configured origins", async () => {
    process.env.ALLOWED_ORIGINS = "https://trusted.com";
    const request = new NextRequest(mockUrl, {
      headers: { origin: "https://trusted.com" }
    });
    const response = NextResponse.json({ success: true });
    
    const responseWithHeaders = addCorsHeaders(response, request);
    expect(responseWithHeaders.headers.get("Access-Control-Allow-Origin")).toBe("https://trusted.com");
  });

  it("should block untrusted origins in preflight", async () => {
    process.env.ALLOWED_ORIGINS = "https://trusted.com";
    const request = new NextRequest(mockUrl, {
      method: "OPTIONS",
      headers: { origin: "https://malicious.com" }
    });
    
    const preflightResponse = handleCorsPreflight(request);
    expect(preflightResponse?.status).toBe(403);
  });
});

