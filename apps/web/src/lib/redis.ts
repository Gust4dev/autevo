import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const redis = process.env.UPSTASH_REDIS_REST_URL
    ? Redis.fromEnv()
    : null;

export const trackingRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'),
        analytics: true,
        prefix: '@autevo/ratelimit/tracking',
    })
    : null;
