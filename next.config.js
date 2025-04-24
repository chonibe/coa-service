/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Skip type checking during build
    skipTypeChecking: true,
    // Skip middleware during build
    skipMiddlewareUrlNormalize: true,
    // Skip trailing slash redirect
    skipTrailingSlashRedirect: true,
    // Disable not-found generation
    disableNotFoundGenerationForPages: true,
    disableNotFoundGenerationForAppDir: true,
  },
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during build
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Use separate build directories for dev and prod
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  // Completely disable static optimization for not-found
  pageExtensions: ["tsx", "ts", "jsx", "js"].filter((ext) => ext !== "not-found.tsx"),
}

module.exports = nextConfig
