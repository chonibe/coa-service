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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com https://www.googletagmanager.com https://www.google-analytics.com https://*.googleadservices.com https://googleads.g.doubleclick.net https://embed.tawk.to https://cdn.jsdelivr.net https://js.stripe.com https://maps.googleapis.com", // Google Analytics + Stripe.js + Tawk.to chat + Google Places
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com https://embed.tawk.to https://cdn.jsdelivr.net https://*.stripe.com", // Tawk.to + Stripe Payment Element styles
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to https://embed.tawk.to", // Tawk.to chat fonts
      "connect-src 'self' data: https://*.supabase.co https://*.shopify.com https://api.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.google.com https://*.doubleclick.net https://maps.googleapis.com https://api.mapbox.com https://*.tiles.mapbox.com mapbox: https://*.spline.design https://unpkg.com https://www.gstatic.com https://fonts.gstatic.com https://*.tawk.to https://tawk.to https://embed.tawk.to wss://*.tawk.to wss://embed.tawk.to blob: https://*.stripe.com https://pay.google.com", // data: for texture fetch; Mapbox + Spline 3D + Stripe + Tawk.to + Google Places + Google Pay manifest (incl. WebSocket)
      "worker-src 'self' blob:", // Allow Mapbox web workers
      "child-src 'self' blob:", // Allow Mapbox child contexts
      "frame-src 'self' https://*.supabase.co https://open.spotify.com https://*.spotify.com https://www.youtube.com https://player.vimeo.com https://www.googletagmanager.com https://my.spline.design https://*.spline.design https://embed.tawk.to https://js.stripe.com https://*.stripe.com https://hooks.stripe.com", // GTM + Spline 3D + Stripe Payment Element/3DS + Tawk.to chat
      "media-src 'self' https://*.supabase.co https://cdn.shopify.com https://thestreetcollector.com blob:",
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
  async redirects() {
    const faviconCdnUrl = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/IMG_20251221_155559_681.webp?v=1767355941'
    return [
      {
        source: "/favicon.ico",
        destination: `/api/proxy-image?url=${encodeURIComponent(faviconCdnUrl)}`,
        permanent: false,
      },
      // Affiliate product links → main page (/); cookie is set in middleware for Experience vendor filter
      {
        source: "/products/:path*",
        destination: "/",
        permanent: false,
      },
    ]
  },
  // Webpack configuration for web components support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable web components in client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
      // Fix @splinetool/runtime physics chunk loading (ChunkLoadError)
      config.optimization ??= {}
      config.optimization.innerGraph = false
    }
    // Dedupe Three.js – @splinetool/runtime and spline-3d-preview both use it
    config.resolve.alias = {
      ...config.resolve.alias,
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Next.js config is CJS
      three: require('path').resolve(__dirname, 'node_modules/three'),
    }
    return config
  },
  // This helps with potential CORS issues in development
  async rewrites() {
    return [
      // Root / is the main page (app/page.tsx re-exports street-collector); no redirect to /shop/street-collector
      // /products/* is redirected to /shop/street-collector via redirects() (affiliate links)
      // /collections/* (e.g. /collections/kymo-one) -> artist profile at /shop/artists/*
      {
        source: "/collections/:path*",
        destination: "/shop/artists/:path*",
      },
      // Experience at /experience (no /shop prefix) — https://app.thestreetcollector.com/experience
      {
        source: "/experience",
        destination: "/shop/experience",
      },
      {
        source: "/experience/:path*",
        destination: "/shop/experience/:path*",
      },
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
