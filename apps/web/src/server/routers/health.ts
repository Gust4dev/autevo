import { router, publicProcedure } from '../trpc';
import { redis } from '@/lib/rate-limit';

interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latencyMs?: number;
    error?: string;
}

interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
    };
}

export const healthRouter = router({
    check: publicProcedure.query((): { status: string; timestamp: string } => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
    })),

    ping: publicProcedure.query(async ({ ctx }) => {
        const start = Date.now();
        await ctx.db.$queryRaw`SELECT 1`;
        return {
            status: 'ok',
            latency: Date.now() - start,
            timestamp: new Date().toISOString(),
        };
    }),

    detailed: publicProcedure.query(async ({ ctx }): Promise<HealthCheckResponse> => {
        const services: HealthCheckResponse['services'] = {
            database: { status: 'unhealthy' },
            redis: { status: 'unhealthy' },
        };

        // Check Database
        try {
            const dbStart = Date.now();
            await ctx.db.$queryRaw`SELECT 1`;
            services.database = {
                status: 'healthy',
                latencyMs: Date.now() - dbStart,
            };
        } catch (err) {
            services.database = {
                status: 'unhealthy',
                error: err instanceof Error ? err.message : 'Database connection failed',
            };
        }

        // Check Redis
        try {
            const redisStart = Date.now();
            await redis.ping();
            services.redis = {
                status: 'healthy',
                latencyMs: Date.now() - redisStart,
            };
        } catch (err) {
            services.redis = {
                status: 'degraded',
                error: 'Redis unavailable - rate limiting disabled',
            };
        }

        // Determine overall status
        const hasUnhealthy = Object.values(services).some(s => s.status === 'unhealthy');
        const hasDegraded = Object.values(services).some(s => s.status === 'degraded');

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (hasUnhealthy) {
            overallStatus = 'unhealthy';
        } else if (hasDegraded) {
            overallStatus = 'degraded';
        }

        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            services,
        };
    }),
});

