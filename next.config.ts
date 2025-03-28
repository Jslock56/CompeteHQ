import type { NextConfig } from "next";
import nextPwa from 'next-pwa';

const withPWA = nextPwa({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['placeholder.com'],
  },
  webpack: (config) => {
    // Add a fallback for Node.js modules that are required by MongoDB
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
      dns: false,
      os: false,
      child_process: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      crypto: false,
      buffer: false,
      util: false,
      url: false,
      assert: false,
      querystring: false,
    };
    return config;
  },
  // Add server actions and API routes to serverExternalPackages
  // to prevent them from being bundled with client code
  serverExternalPackages: ["mongodb", "mongoose", "bcryptjs", "jsonwebtoken"],
});

export default nextConfig;
