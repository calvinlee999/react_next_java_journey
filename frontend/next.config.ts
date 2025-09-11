import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Next.js App Router Configuration for Full-Stack Capabilities */
  
  // Enable static exports for CDN deployment (when needed)
  // output: 'export', // Uncomment for static site generation only
  
  // Enable standalone output for serverless deployment
  output: 'standalone',
  
  // Enable TypeScript and React optimizations
  typescript: {
    // Dangit! We want type checking during build
    ignoreBuildErrors: false,
  },
  
  // Configure for both SSR and static generation
  trailingSlash: false,
  
  // Enable modern bundling features
  bundlePagesRouterDependencies: true,
  
  // Configure for deployment flexibility
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
};

export default nextConfig;
