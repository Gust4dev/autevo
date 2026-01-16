import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 50 requests per minute per user
export const rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'),
    analytics: true,
});

export async function checkRateLimit(identifier: string) {
    const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);
    return { success, limit, remaining, resetAt: reset };
}
