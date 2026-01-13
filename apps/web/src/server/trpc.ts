import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import '@/lib/superjson-config';
import { ZodError } from 'zod';
import { prisma } from '@autevo/database';
import type { User } from '@autevo/database';
import { checkRateLimit } from '@/lib/rate-limit';

export interface Context {
    db: typeof prisma;
    user: User | null;
    tenantId: string | null;
}

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Middleware: requires auth + valid tenant
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

    // Always fetch latest status from DB to ensure immediate suspension/activation
    const tenant = await ctx.db.tenant.findUnique({
        where: { id: ctx.user.tenantId },
        select: { status: true },
    });

    if (!tenant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
    }

    const status = tenant.status;

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
    if (ctx.user && process.env.UPSTASH_REDIS_REST_URL) {
        const { success } = await checkRateLimit(ctx.user.id);
        if (!success) {
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: 'Limite de requisições excedido. Tente novamente em alguns segundos.',
            });
        }
    }
    return next();
});

export const protectedProcedure = publicProcedure
    .use(tenantMiddleware)
    .use(rateLimitMiddleware);

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
