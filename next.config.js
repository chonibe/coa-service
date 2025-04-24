/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's unrecognized in the current Next.js version
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/modals'],
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
}

module.exports = nextConfig
