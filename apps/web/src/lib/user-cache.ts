import type { User } from '@filmtech/database';

interface CachedUser {
    user: User & { tenant: { id: string; status: string } | null };
    timestamp: number;
}

const userCache = new Map<string, CachedUser>();
export const USER_CACHE_TTL = 5 * 1000; // 5 seconds

export function getCachedUser(clerkId: string): CachedUser | undefined {
    return userCache.get(clerkId);
}

export function setCachedUser(clerkId: string, user: CachedUser['user']): void {
    userCache.set(clerkId, { user, timestamp: Date.now() });
}

export function invalidateUserCache(clerkId: string): void {
    userCache.delete(clerkId);
}

export function isCacheValid(clerkId: string): boolean {
    const cached = userCache.get(clerkId);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < USER_CACHE_TTL;
}
