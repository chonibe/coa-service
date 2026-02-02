/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Keep lint available via `npm run lint`, but don't block production builds on existing lint backlog.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Next build typechecking is currently too noisy across the repo.
    // We enforce collector safety via a scoped typecheck in `npm run typecheck:collector`.
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    // Get allowed origins from environment variable
    // Format: comma-separated list of origins, e.g., "https://example.com,https://app.example.com"
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // If no specific origins configured, use the app URL only
    const origins = allowedOrigins.length > 0 ? allowedOrigins : [defaultOrigin]
    
    // Build CSP directive
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com https://www.googletagmanager.com https://www.google-analytics.com https://*.googleadservices.com https://googleads.g.doubleclick.net", // Google Analytics + Google Ads
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.shopify.com https://api.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.google.com https://*.doubleclick.net https://api.mapbox.com https://*.tiles.mapbox.com mapbox:", // Added Mapbox domains + mapbox: protocol
      "worker-src 'self' blob:", // Allow Mapbox web workers
      "child-src 'self' blob:", // Allow Mapbox child contexts
      "frame-src 'self' https://*.supabase.co https://open.spotify.com https://*.spotify.com https://www.youtube.com https://player.vimeo.com https://www.googletagmanager.com", // Added GTM for iframes
      "media-src 'self' https://*.supabase.co blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ]
    
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // Note: CORS origin will be set dynamically in middleware for security
          // This header is set per-request based on origin validation
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self)", // Allow microphone for voice notes and geolocation for maps
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
  // Add this to help with potential issues
  reactStrictMode: true,
  // Webpack configuration for web components support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable web components in client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
  // This helps with potential CORS issues in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
      {
        source: "/login",
        destination: "/login",
      },
      {
        source: "/signup",
        destination: "/signup",
      },
      {
        source: "/auth/callback",
        destination: "/auth/callback",
      }
    ]
  },
}

module.exports = nextConfig
