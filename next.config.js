/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental flags as they're no longer needed in Next.js 14
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Add image optimization configuration
  images: {
    domains: ['repeeker.com'],
  },
  // Ensure proper handling of app directory
  output: 'standalone'
};

module.exports = nextConfig; 