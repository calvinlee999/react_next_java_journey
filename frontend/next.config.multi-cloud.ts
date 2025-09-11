import type { NextConfig } from "next";

/**
 * Next.js Configuration for Multi-Cloud Deployment
 * Supports: AWS S3/CloudFront, Azure Blob/CDN, Static Generation, SSR
 */

// Determine deployment target from environment
const deploymentTarget = process.env.DEPLOYMENT_TARGET || 'standalone';
const isStatic = deploymentTarget === 'static';
const isAWS = process.env.CLOUD_PROVIDER === 'aws';
const isAzure = process.env.CLOUD_PROVIDER === 'azure';

const nextConfig: NextConfig = {
  // Dynamic output configuration based on deployment target
  output: isStatic ? 'export' : 'standalone',
  
  // Configure for static generation (CSR) or server rendering (SSR)
  ...(isStatic && {
    // Static generation configuration for CDN deployment
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
    images: {
      unoptimized: true, // Required for static export
    },
  }),

  // Configure for standalone deployment (SSR/Docker)
  ...(!isStatic && {
    // Server-side rendering configuration
    // experimental: {
    //   // Add experimental features as needed
    // },
  }),

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configure asset prefix for CDN
  assetPrefix: (() => {
    if (isStatic) {
      if (isAWS) {
        return process.env.AWS_CLOUDFRONT_DOMAIN || '';
      }
      if (isAzure) {
        return process.env.AZURE_CDN_ENDPOINT || '';
      }
    }
    return '';
  })(),

  // Configure for cross-origin requests
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Configure for static assets
  async rewrites() {
    return [];
  },

  // Environment variables
  env: {
    DEPLOYMENT_TARGET: deploymentTarget,
    CLOUD_PROVIDER: process.env.CLOUD_PROVIDER || 'local',
    CDN_DOMAIN: (() => {
      if (isAWS) return process.env.AWS_CLOUDFRONT_DOMAIN || '';
      if (isAzure) return process.env.AZURE_CDN_ENDPOINT || '';
      return '';
    })(),
  },

  // Configure images for different cloud providers
  images: {
    ...(isStatic && { unoptimized: true }),
    ...(!isStatic && {
      domains: [
        // AWS domains
        ...(isAWS ? [
          's3.amazonaws.com',
          process.env.AWS_S3_BUCKET ? `${process.env.AWS_S3_BUCKET}.s3.amazonaws.com` : '',
          process.env.AWS_CLOUDFRONT_DOMAIN || '',
        ].filter(Boolean) : []),
        
        // Azure domains
        ...(isAzure ? [
          'blob.core.windows.net',
          process.env.AZURE_STORAGE_ACCOUNT ? `${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net` : '',
          process.env.AZURE_CDN_ENDPOINT || '',
        ].filter(Boolean) : []),
      ],
    }),
  },

  // Configure webpack for different deployment targets
  webpack: (config) => {
    // Optimize for static builds
    if (isStatic) {
      config.output.trailingSlash = true;
    }

    // Add cloud-specific optimizations
    if (isAWS) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@aws-sdk/client-s3': require.resolve('@aws-sdk/client-s3'),
      };
    }

    if (isAzure) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@azure/storage-blob': require.resolve('@azure/storage-blob'),
      };
    }

    return config;
  },
};

export default nextConfig;
