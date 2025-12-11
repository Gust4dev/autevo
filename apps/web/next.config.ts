import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Experimental features
    experimental: {
        // Enable server actions
        serverActions: {
            bodySizeLimit: '10mb', // For photo uploads
        },
    },

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.r2.cloudflarestorage.com',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
        ],
    },

    // Transpile packages from monorepo
    transpilePackages: ['@filmtech/database'],
};

export default nextConfig;
