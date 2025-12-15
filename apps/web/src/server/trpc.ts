import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from '@filmtech/database';
import type { User } from '@filmtech/database';

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

// Simple in-memory cache for tenant status: { [tenantId: string]: { status: string, timestamp: number } }
const tenantCache: Record<string, { status: string; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

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

    const now = Date.now();
    const cached = tenantCache[ctx.user.tenantId];
    let status: string | undefined;

    // Check cache
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        status = cached.status;
    } else {
        // Cache miss or stale, fetch from DB
        const tenant = await ctx.db.tenant.findUnique({
            where: { id: ctx.user.tenantId },
            select: { status: true },
        });

        if (!tenant) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
        }

        status = tenant.status;

        // Update cache
        tenantCache[ctx.user.tenantId] = { status, timestamp: now };
    }

    if (status === 'CANCELED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Subscription canceled' });
    }

    return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.user.tenantId } });
});

export const protectedProcedure = publicProcedure.use(tenantMiddleware);

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
