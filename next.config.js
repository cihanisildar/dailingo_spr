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
  // Add specific webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      // Disable source maps in production
      config.devtool = false;
      
      // Optimize chunks
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
          automaticNameDelimiter: '.',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `vendor.${packageName.replace('@', '')}`;
              },
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig; 