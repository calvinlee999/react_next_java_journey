import type { NextConfig } from "next";

// Configuration for static export (CDN deployment)
const nextConfigStatic: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  }
};

export default nextConfigStatic;
