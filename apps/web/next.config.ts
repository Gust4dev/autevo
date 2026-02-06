import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    cacheStartUrl: false,
    dynamicStartUrl: false,
    dynamicStartUrlRedirect: undefined,
    workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/.*\.clerk\..*$/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'clerk-cache',
                    expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
                },
            },
            {
                urlPattern: /\/api\/trpc\/.*/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'api-cache',
                    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
                },
            },
            {
                urlPattern: /\/_next\/static\/.*/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'static-cache',
                    expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
            },
            {
                urlPattern: /\/_next\/image\?.*/,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'image-cache',
                    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
                },
            },
        ],
    },
} as Parameters<typeof withPWAInit>[0]);

const nextConfig: NextConfig = {
    reactStrictMode: true,
    trailingSlash: false,

    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        optimizePackageImports: [
            'lucide-react',
            'recharts',
            '@radix-ui/react-icons',
            'framer-motion',
            'date-fns',
            '@tanstack/react-query',
            '@clerk/nextjs',
        ],
    },

    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
            { protocol: 'https', hostname: 'img.clerk.com' },
        ],
    },

    transpilePackages: ['@autevo/database'],

    async headers() {
        return [{
            source: '/:path*',
            headers: [
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-XSS-Protection', value: '1; mode=block' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            ],
        }];
    },
};

export default withSentryConfig(withPWA(nextConfig), {
    org: "gusta-dev",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    webpack: {
        automaticVercelMonitors: true,
        treeshake: {
            removeDebugLogging: true,
        },
    },
});
