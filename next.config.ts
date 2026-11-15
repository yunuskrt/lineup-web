import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // A restored dev cache served stale Tailwind CSS
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
