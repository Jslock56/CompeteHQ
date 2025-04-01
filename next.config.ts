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
  webpack: (config, { dev, isServer }) => {
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

    // Optimize bundle size for production builds
    if (!dev && !isServer) {
      // Add a custom plugin for Chakra UI optimization
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: true,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ];
      
      // Enable additional optimizations
      if (config.optimization) {
        // These settings help with tree-shaking
        config.optimization.usedExports = true;
        config.optimization.sideEffects = true;
        
        // Improve chunk splitting
        if (!config.optimization.splitChunks) {
          config.optimization.splitChunks = {};
        }
        
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            // Create a separate chunk for Chakra UI components
            chakra: {
              test: /[\\/]node_modules[\\/](@chakra-ui|@emotion)[\\/]/,
              name: 'chakra-ui',
              priority: 20,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Separate vendor chunk
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              enforce: true,
              reuseExistingChunk: true,
            },
          },
        };
      }
    }

    return config;
  },
  // Add server actions and API routes to serverExternalPackages
  // to prevent them from being bundled with client code
  serverExternalPackages: ["mongodb", "mongoose", "bcryptjs", "jsonwebtoken"],
});

export default nextConfig;
