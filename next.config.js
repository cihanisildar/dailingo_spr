/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['repeeker.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig; 