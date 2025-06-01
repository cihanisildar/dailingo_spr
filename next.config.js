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
  // Optimize build process
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@prisma/client', 'date-fns', 'lucide-react'],
    // Add memory optimization
    memoryBasedWorkersCount: true,
    // Disable some heavy optimizations
    optimizeServerReact: false,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Handle error pages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add webpack optimization
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig; 