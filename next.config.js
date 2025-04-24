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
  // Disable static generation for all pages
  output: "export",
  // Disable static generation for not-found page
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
}

module.exports = nextConfig
