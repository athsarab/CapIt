import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
