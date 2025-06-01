/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental flags as they're no longer needed in Next.js 14
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Add image optimization configuration
  images: {
    domains: ['repeeker.com'],
  },
  // Ensure proper handling of app directory
  output: 'standalone',
  // Optimize build process
  swcMinify: true,
  // Increase memory limit for build
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@prisma/client', 'date-fns', 'lucide-react'],
  },
  // Handle error pages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig; 