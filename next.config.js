/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
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
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.shopify.com', pathname: '/**' },
      { protocol: 'https', hostname: 'thestreetcollector.com', pathname: '/**' },
    ],
  },
  async headers() {
    // Get allowed origins from environment variable
    // Format: comma-separated list of origins, e.g., "https://example.com,https://app.example.com"
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // If no specific origins configured, use the app URL only
    const origins = allowedOrigins.length > 0 ? allowedOrigins : [defaultOrigin]
    
    // Build CSP directive. unsafe-eval required for Spline 3D runtime (loads .splinecode); unsafe-inline for Next.js and third-party scripts until nonce-based CSP (see docs/SECURITY_VULNERABILITY_FINDINGS.md #10).
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.googleadservices.com https://googleads.g.doubleclick.net https://connect.facebook.net https://embed.tawk.to https://*.tawk.to https://cdn.jsdelivr.net https://js.stripe.com https://maps.googleapis.com https://static.hotjar.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://*.posthog.com", // + Spline unsafe-eval; PostHog; Meta Pixel; Tawk.to
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com https://embed.tawk.to https://cdn.jsdelivr.net https://*.stripe.com", // Tawk.to + Stripe Payment Element styles
      "img-src 'self' data: https: blob: https://www.facebook.com",
      "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to https://embed.tawk.to", // Tawk.to chat fonts
      "connect-src 'self' data: https://*.supabase.co https://*.shopify.com https://api.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.google.com https://*.doubleclick.net https://www.facebook.com https://graph.facebook.com https://maps.googleapis.com https://api.mapbox.com https://*.tiles.mapbox.com mapbox: https://*.spline.design https://unpkg.com https://www.gstatic.com https://fonts.gstatic.com https://*.tawk.to https://tawk.to https://embed.tawk.to wss://*.tawk.to wss://embed.tawk.to blob: https://*.stripe.com https://pay.google.com https://*.hotjar.io https://*.hotjar.com https://us.i.posthog.com https://us-assets.i.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com", // + Hotjar + PostHog + Meta
      "worker-src 'self' blob:", // Allow Mapbox web workers
      "child-src 'self' blob:", // Allow Mapbox child contexts
      "frame-src 'self' https://*.supabase.co https://open.spotify.com https://*.spotify.com https://www.youtube.com https://player.vimeo.com https://www.googletagmanager.com https://my.spline.design https://*.spline.design https://embed.tawk.to https://*.tawk.to https://js.stripe.com https://*.stripe.com https://hooks.stripe.com https://us.posthog.com https://eu.posthog.com https://*.posthog.com", // GTM + Spline + Stripe + Tawk.to + PostHog
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
            // same-origin-allow-popups: retains cross-origin isolation for the page while
            // allowing Stripe's Google Pay / Stripe Link popups to communicate back.
            // "same-origin" blocked those popups and logged console errors flagged by Lighthouse.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)", // Allow camera for experience AR preview; microphone for voice notes; geolocation for maps
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
    const faviconCdnUrl = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535'
    return [
      {
        source: "/blogs/gifts",
        destination: "/",
        permanent: true,
      },
      {
        source: "/pages/about-us",
        destination: "/",
        permanent: true,
      },
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
      // /collections/* is handled in middleware (redirect to / with affiliate cookie from path); no rewrite so middleware runs
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
