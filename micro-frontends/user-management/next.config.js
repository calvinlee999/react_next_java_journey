/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: false,
  },
  // Standalone micro-frontend configuration
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
};

module.exports = nextConfig;
