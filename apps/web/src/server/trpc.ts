import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import '@/lib/superjson-config';
import { ZodError } from 'zod';
import { prisma, Prisma } from '@autevo/database';
import type { User } from '@autevo/database';
import { checkRateLimit, redis } from '@/lib/rate-limit';

export interface Context {
    db: typeof prisma;
    user: User | null;
    tenantId: string | null;
}

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        const isProduction = process.env.NODE_ENV === 'production';

        // Sanitize messages in production to avoid leaking DB internals
        let message = shape.message;
        if (isProduction && (error.code === 'INTERNAL_SERVER_ERROR' || error.cause instanceof Prisma.PrismaClientKnownRequestError)) {
            message = 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.';
        }

        return {
            ...shape,
            message,
            data: {
                ...shape.data,
                zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

export const router = t.router;
export const middleware = t.middleware;

const TENANT_CACHE_TTL = 1800; // 30 minutes in seconds

async function getTenantStatus(tenantId: string, db: typeof prisma): Promise<string | null> {
    const cacheKey = `tenant:status:${tenantId}`;

    try {
        const cachedStatus = await redis.get<string>(cacheKey);
        if (cachedStatus) {
            return cachedStatus;
        }
    } catch {
        // Redis unavailable, fall through to DB query
    }

    const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        select: { status: true },
    });

    if (!tenant) {
        return null;
    }

    try {
        await redis.set(cacheKey, tenant.status, { ex: TENANT_CACHE_TTL });
    } catch {
        // Redis unavailable, continue without caching
    }

    return tenant.status;
}

export async function invalidateTenantCache(tenantId: string): Promise<void> {
    const cacheKey = `tenant:status:${tenantId}`;
    try {
        await redis.del(cacheKey);
    } catch {
        // Redis unavailable, ignore
    }
}

const tenantMiddleware = middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Login required' });
    }

    if (ctx.user.role === 'ADMIN_SAAS') {
        return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.tenantId } });
    }

    if (!ctx.user.tenantId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No tenant assigned' });
    }

    const status = await getTenantStatus(ctx.user.tenantId, ctx.db);

    if (!status) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
    }

    if (status === 'PENDING_ACTIVATION') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Account pending activation. Please complete payment.',
        });
    }

    if (status === 'SUSPENDED') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Account suspended. Please contact support.',
        });
    }

    if (status === 'CANCELED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Subscription canceled' });
    }

    return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.user.tenantId } });
});

const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
    const identifier = ctx.user?.id || 'anonymous';

    if (process.env.UPSTASH_REDIS_REST_URL) {
        const { success } = await checkRateLimit(identifier);
        if (!success) {
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
            });
        }
    }
    return next();
});

export const publicProcedure = t.procedure.use(rateLimitMiddleware);
export const publicProcedureNoRateLimit = t.procedure;

const authMiddleware = middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Login required' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authenticatedProcedure = publicProcedure.use(authMiddleware);

export const protectedProcedure = publicProcedure
    .use(tenantMiddleware);

// Protected procedure WITHOUT rate limit - for high-frequency operations like inspections
export const protectedProcedureNoRateLimit = publicProcedureNoRateLimit
    .use(tenantMiddleware);

// Role-based procedures
const requireRole = (roles: string[]) =>
    middleware(async ({ ctx, next }) => {
        if (!ctx.user) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        if (!roles.includes(ctx.user.role)) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next({ ctx });
    });

export const managerProcedure = protectedProcedure.use(
    requireRole(['ADMIN_SAAS', 'OWNER', 'MANAGER'])
);

export const ownerProcedure = protectedProcedure.use(
    requireRole(['ADMIN_SAAS', 'OWNER'])
);

export const adminProcedure = protectedProcedure.use(requireRole(['ADMIN_SAAS']));
