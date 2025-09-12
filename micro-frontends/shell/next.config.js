/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: false,
  },
  // For now, we'll use a simpler approach without Module Federation
  // and focus on demonstrating the micro-frontend architecture concept
  async rewrites() {
    return [
      // Proxy requests to micro-frontends during development
      {
        source: '/mf/user-management/:path*',
        destination: 'http://localhost:3001/:path*',
      },
      {
        source: '/mf/analytics/:path*',
        destination: 'http://localhost:3003/:path*',
      },
      {
        source: '/mf/ecommerce/:path*',
        destination: 'http://localhost:3004/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
