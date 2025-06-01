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
  swcMinify: false,
  // Disable experimental features
  experimental: {
    // Disable all experimental features
    optimizeCss: false,
    optimizePackageImports: [],
  },
  // Handle error pages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable build traces
  generateBuildId: () => 'build',
  // Optimize build process
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Disable static optimization
  staticPageGenerationTimeout: 0,
  // Disable automatic static optimization for all pages
  staticPageGenerationTimeout: 0,
  // Add specific webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      // Disable source maps in production
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig; 