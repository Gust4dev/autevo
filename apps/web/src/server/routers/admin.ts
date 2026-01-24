import { z } from 'zod';
import { router, adminProcedure, publicProcedure, invalidateTenantCache } from '../trpc';
import { TRPCError } from '@trpc/server';
import { TenantStatus } from '@prisma/client';

// Admin router - only accessible by ADMIN_SAAS role
export const adminRouter = router({
    // Get dashboard statistics
    getDashboardStats: adminProcedure.query(async ({ ctx }) => {
        // Fetch system config first
        const configs = await ctx.db.systemConfig.findMany({
            where: { key: { in: ['pro_monthly_price', 'trial_days_founder'] } },
        });
        const configMap = new Map(configs.map((c) => [c.key, c.value]));
        const monthlyPrice = Number(configMap.get('pro_monthly_price') || '190'); // Default updated to 190 per user request context
        const founderPrice = 140; // Fixed founder price or fetch if needed
        const trialFounderPrice = 97; // 60 days trial price

        const [
            totalTenants,
            pendingActivation,
            trialTenants,
            activeTenants,
            suspendedTenants,
            canceledTenants,
            adminTenants,
        ] = await Promise.all([
            ctx.db.tenant.count({ where: { plan: { not: 'ADMIN' } } }),
            ctx.db.tenant.count({ where: { status: 'PENDING_ACTIVATION', plan: { not: 'ADMIN' } } }),
            ctx.db.tenant.count({ where: { status: 'TRIAL', plan: { not: 'ADMIN' } } }),
            ctx.db.tenant.count({ where: { status: 'ACTIVE', plan: { not: 'ADMIN' } } }),
            ctx.db.tenant.count({ where: { status: 'SUSPENDED', plan: { not: 'ADMIN' } } }),
            ctx.db.tenant.count({ where: { status: 'CANCELED', plan: { not: 'ADMIN' } } }),
            ctx.db.tenant.count({ where: { plan: 'ADMIN' } }),
        ]);

        // More accurate revenue calculation fetching active tenants with custom prices
        const payingTenants = await ctx.db.tenant.findMany({
            where: {
                status: 'ACTIVE',
                plan: { not: 'ADMIN' }
            },
            select: { customMonthlyPrice: true, isFoundingMember: true }
        });

        const revenue = payingTenants.reduce((sum, t) => {
            if (t.customMonthlyPrice) return sum + Number(t.customMonthlyPrice);
            if (t.isFoundingMember) return sum + founderPrice;
            return sum + monthlyPrice;
        }, 0);

        // Add revenue from founding trials (approximate)
        const foundingTrials = await ctx.db.tenant.count({
            where: { status: 'TRIAL', isFoundingMember: true, plan: { not: 'ADMIN' } }
        });

        // We can consider trial revenue as realized or potential. Here we list MRR (Recurring).
        // Trial payment (97) is one-off, so maybe exclued from MRR stats, or amortized.
        // User asked for "valor que recebemos mensalmente". Active subscriptions are the recurring part.

        return {
            totalTenants,
            adminTenants,
            byStatus: {
                pendingActivation,
                trial: trialTenants,
                active: activeTenants,
                suspended: suspendedTenants,
                canceled: canceledTenants,
            },
            estimatedMonthlyRevenue: revenue,
        };
    }),

    // List all tenants with pagination and filters
    listTenants: adminProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                limit: z.number().min(1).max(50).default(20),
                status: z.nativeEnum(TenantStatus).optional(),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, limit, status, search } = input;
            const skip = (page - 1) * limit;

            const where = {
                ...(status && { status }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { users: { some: { email: { contains: search, mode: 'insensitive' as const } } } },
                    ],
                }),
            };

            const [tenants, total] = await Promise.all([
                ctx.db.tenant.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        users: {
                            where: { role: 'OWNER' },
                            select: { name: true, email: true },
                            take: 1,
                        },
                        _count: {
                            select: { orders: true, customers: true },
                        },
                    },
                }),
                ctx.db.tenant.count({ where }),
            ]);

            return {
                tenants: tenants.map((t) => ({
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    status: t.status,
                    createdAt: t.createdAt,
                    trialStartedAt: t.trialStartedAt,
                    trialEndsAt: t.trialEndsAt,
                    owner: t.users[0] || null,
                    usage: {
                        orders: t._count.orders,
                        customers: t._count.customers,
                    },
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }),

    // Get tenant details
    getTenantDetails: adminProcedure
        .input(z.object({ tenantId: z.string() }))
        .query(async ({ ctx, input }) => {
            const tenant = await ctx.db.tenant.findUnique({
                where: { id: input.tenantId },
                include: {
                    users: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                    _count: {
                        select: {
                            orders: true,
                            customers: true,
                            vehicles: true,
                            services: true,
                        },
                    },
                },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            // Get last order date as "last activity"
            const lastOrder = await ctx.db.serviceOrder.findFirst({
                where: { tenantId: tenant.id },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            });

            const now = new Date();

            // Calculate trial time remaining
            let trialTimeRemaining = null;
            let trialProgress = 0;
            if (tenant.trialEndsAt && tenant.trialStartedAt) {
                const totalMs = tenant.trialEndsAt.getTime() - now.getTime();
                const isExpired = totalMs <= 0;
                const totalTrialMs = tenant.trialEndsAt.getTime() - tenant.trialStartedAt.getTime();
                const elapsedMs = now.getTime() - tenant.trialStartedAt.getTime();
                trialProgress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalTrialMs) * 100)));

                if (!isExpired) {
                    const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
                    const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                    const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
                    trialTimeRemaining = { days, hours, minutes, totalMs, isExpired: false };
                } else {
                    trialTimeRemaining = { days: 0, hours: 0, minutes: 0, totalMs: 0, isExpired: true };
                }
            }

            // Calculate system usage time
            const usageMs = now.getTime() - tenant.createdAt.getTime();
            const systemUsageTime = {
                days: Math.floor(usageMs / (24 * 60 * 60 * 1000)),
                hours: Math.floor((usageMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
                minutes: Math.floor((usageMs % (60 * 60 * 1000)) / (60 * 1000)),
                totalDays: Math.floor(usageMs / (24 * 60 * 60 * 1000)),
            };

            return {
                ...tenant,
                usage: tenant._count,
                lastActivity: lastOrder?.createdAt || tenant.createdAt,
                trialTimeRemaining,
                trialProgress,
                systemUsageTime,
            };
        }),

    // Activate trial (PENDING_ACTIVATION -> TRIAL)
    activateTrial: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                trialDays: z.number().min(1).max(365).default(60),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, trialDays } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                select: { status: true, name: true },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            if (tenant.status !== 'PENDING_ACTIVATION') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Cannot activate trial for tenant with status: ${tenant.status}`,
                });
            }

            const now = new Date();
            const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data: {
                    status: 'TRIAL',
                    trialStartedAt: now,
                    trialEndsAt,
                },
            });

            await invalidateTenantCache(tenantId);

            // Update Clerk metadata for all users in this tenant
            const users = await ctx.db.user.findMany({
                where: { tenantId },
                select: { id: true, clerkId: true, role: true },
            });

            if (users.length > 0) {
                const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
                await Promise.all(
                    users
                        .filter(u => u.clerkId)
                        .map(u =>
                            clerk.users.updateUser(u.clerkId!, {
                                publicMetadata: {
                                    tenantId,
                                    role: u.role,
                                    dbUserId: u.id,
                                    tenantStatus: 'TRIAL',
                                    trialEndsAt: trialEndsAt.toISOString(),
                                    isFoundingMember: updated.isFoundingMember,
                                },
                            })
                        )
                );
            }

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId,
                userId: ctx.user?.id,
                action: 'ADMIN_ACTIVATE_TRIAL',
                entityType: 'Tenant',
                entityId: tenantId,
                oldValue: { status: tenant.status },
                newValue: { status: 'TRIAL', trialDays },
            });

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    status: updated.status,
                    trialStartedAt: updated.trialStartedAt,
                    trialEndsAt: updated.trialEndsAt,
                },
            };
        }),

    // Extend trial
    extendTrial: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                additionalDays: z.number().min(1).max(365),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, additionalDays } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                select: { status: true, name: true, trialEndsAt: true, isFoundingMember: true },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            if (tenant.status !== 'TRIAL') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Cannot extend trial for tenant with status: ${tenant.status}`,
                });
            }

            const currentEnd = tenant.trialEndsAt || new Date();
            const newEnd = new Date(currentEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data: { trialEndsAt: newEnd },
            });

            // Update Clerk metadata for all users in this tenant
            const users = await ctx.db.user.findMany({
                where: { tenantId },
                select: { clerkId: true, role: true, id: true },
            });

            if (users.length > 0) {
                const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
                await Promise.all(
                    users
                        .filter(u => u.clerkId)
                        .map(u =>
                            clerk.users.updateUser(u.clerkId!, {
                                publicMetadata: {
                                    tenantId,
                                    role: u.role,
                                    dbUserId: u.id,
                                    tenantStatus: 'TRIAL',
                                    trialEndsAt: newEnd.toISOString(),
                                    isFoundingMember: tenant.isFoundingMember,
                                },
                            })
                        )
                );
            }

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    trialEndsAt: updated.trialEndsAt,
                },
            };
        }),

    // Delete tenant (SaaS Admin only)
    deleteTenant: adminProcedure
        .input(z.object({ tenantId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { tenantId } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                include: { users: { select: { clerkId: true } } }
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            // Delete users from Clerk
            const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
            const usersToDelete = tenant.users.filter(u => u.clerkId);

            await Promise.allSettled(
                usersToDelete.map(u => clerk.users.deleteUser(u.clerkId!))
            );

            // Delete tenant (DB Cascade will handle the rest)
            await ctx.db.tenant.delete({
                where: { id: tenantId }
            });

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId: 'SYSTEM',
                userId: ctx.user?.id,
                action: 'ADMIN_DELETE_TENANT',
                entityType: 'Tenant',
                entityId: tenantId,
                oldValue: { name: tenant.name, status: tenant.status },
                newValue: null,
            });

            return { success: true };
        }),

    // Suspend tenant
    suspendTenant: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, reason } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                select: { status: true, name: true },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELED') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Tenant is already ${tenant.status}`,
                });
            }

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data: { status: 'SUSPENDED' },
            });

            await invalidateTenantCache(tenantId);

            // Update Clerk metadata for all users in this tenant
            const users = await ctx.db.user.findMany({
                where: { tenantId },
                select: { id: true, clerkId: true, role: true },
            });

            if (users.length > 0) {
                const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
                await Promise.all(
                    users
                        .filter(u => u.clerkId)
                        .map(u =>
                            clerk.users.updateUser(u.clerkId!, {
                                publicMetadata: {
                                    tenantId,
                                    role: u.role,
                                    dbUserId: u.id,
                                    tenantStatus: 'SUSPENDED',
                                },
                            })
                        )
                );
            }

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId,
                userId: ctx.user?.id,
                action: 'ADMIN_SUSPEND_TENANT',
                entityType: 'Tenant',
                entityId: tenantId,
                oldValue: { status: tenant.status },
                newValue: { status: 'SUSPENDED', reason },
            });

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    status: updated.status,
                },
            };
        }),

    // Reactivate tenant (SUSPENDED -> TRIAL or ACTIVE)
    reactivateTenant: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                asStatus: z.enum(['TRIAL', 'ACTIVE']),
                trialDays: z.number().min(1).max(365).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, asStatus, trialDays } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                select: { status: true, name: true },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            if (tenant.status !== 'SUSPENDED') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Can only reactivate SUSPENDED tenants. Current status: ${tenant.status}`,
                });
            }

            const now = new Date();
            const data: Record<string, unknown> = {
                status: asStatus,
            };

            if (asStatus === 'TRIAL' && trialDays) {
                data.trialStartedAt = now;
                data.trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
            }

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data,
            });

            await invalidateTenantCache(tenantId);

            // Update Clerk metadata for all users in this tenant
            const users = await ctx.db.user.findMany({
                where: { tenantId },
                select: { id: true, clerkId: true, role: true },
            });

            if (users.length > 0) {
                const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
                await Promise.all(
                    users
                        .filter(u => u.clerkId)
                        .map(u =>
                            clerk.users.updateUser(u.clerkId!, {
                                publicMetadata: {
                                    tenantId,
                                    role: u.role,
                                    dbUserId: u.id,
                                    tenantStatus: asStatus,
                                },
                            })
                        )
                );
            }

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId,
                userId: ctx.user?.id,
                action: 'ADMIN_REACTIVATE_TENANT',
                entityType: 'Tenant',
                entityId: tenantId,
                oldValue: { status: tenant.status },
                newValue: { status: asStatus, trialDays },
            });

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    status: updated.status,
                    trialEndsAt: updated.trialEndsAt,
                },
            };
        }),

    // Get tenants expiring soon (for follow-up)
    getExpiringTrials: adminProcedure
        .input(z.object({ daysAhead: z.number().min(1).max(30).default(7) }))
        .query(async ({ ctx, input }) => {
            const now = new Date();
            const futureDate = new Date(now.getTime() + input.daysAhead * 24 * 60 * 60 * 1000);

            const tenants = await ctx.db.tenant.findMany({
                where: {
                    status: 'TRIAL',
                    trialEndsAt: {
                        gte: now,
                        lte: futureDate,
                    },
                },
                include: {
                    users: {
                        where: { role: 'OWNER' },
                        select: { name: true, email: true, phone: true },
                        take: 1,
                    },
                },
                orderBy: { trialEndsAt: 'asc' },
            });

            return tenants.map((t) => ({
                id: t.id,
                name: t.name,
                trialEndsAt: t.trialEndsAt,
                daysRemaining: t.trialEndsAt
                    ? Math.ceil((t.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
                    : 0,
                owner: t.users[0] || null,
            }));
        }),

    // Get pending activations (awaiting Pix payment)
    getPendingActivations: adminProcedure.query(async ({ ctx }) => {
        const tenants = await ctx.db.tenant.findMany({
            where: { status: 'PENDING_ACTIVATION' },
            include: {
                users: {
                    where: { role: 'OWNER' },
                    select: { name: true, email: true, phone: true },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return tenants.map((t) => ({
            id: t.id,
            name: t.name,
            createdAt: t.createdAt,
            owner: t.users[0] || null,
        }));
    }),

    // Cancel tenant permanently
    cancelTenant: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, reason } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                select: { status: true, name: true },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            if (tenant.status === 'CANCELED') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Tenant is already canceled',
                });
            }

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data: { status: 'CANCELED' },
            });

            await invalidateTenantCache(tenantId);

            // Update Clerk metadata for all users in this tenant
            const users = await ctx.db.user.findMany({
                where: { tenantId },
                select: { id: true, clerkId: true, role: true },
            });

            if (users.length > 0) {
                const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
                await Promise.all(
                    users
                        .filter(u => u.clerkId)
                        .map(u =>
                            clerk.users.updateUser(u.clerkId!, {
                                publicMetadata: {
                                    tenantId,
                                    role: u.role,
                                    dbUserId: u.id,
                                    tenantStatus: 'CANCELED',
                                },
                            })
                        )
                );
            }

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId,
                userId: ctx.user?.id,
                action: 'ADMIN_CANCEL_TENANT',
                entityType: 'Tenant',
                entityId: tenantId,
                oldValue: { status: tenant.status },
                newValue: { status: 'CANCELED', reason },
            });

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    status: updated.status,
                },
            };
        }),

    // Update tenant plan
    updateTenantPlan: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                newPlan: z.enum(['pro_monthly', 'pro_yearly', 'enterprise']),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, newPlan } = input;

            const tenant = await ctx.db.tenant.findUnique({
                where: { id: tenantId },
                select: { plan: true, name: true, status: true },
            });

            if (!tenant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
            }

            const oldPlan = tenant.plan;

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data: { plan: newPlan },
            });

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId,
                userId: ctx.user?.id,
                action: 'ADMIN_CHANGE_PLAN',
                entityType: 'Tenant',
                entityId: tenantId,
                oldValue: { plan: oldPlan },
                newValue: { plan: newPlan },
            });

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    plan: updated.plan,
                },
            };
        }),

    // List audit logs for a tenant (or all tenants)
    listAuditLogs: adminProcedure
        .input(
            z.object({
                tenantId: z.string().optional(),
                page: z.number().min(1).default(1),
                limit: z.number().min(1).max(100).default(50),
                action: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { tenantId, page, limit, action } = input;
            const skip = (page - 1) * limit;

            const where = {
                ...(tenantId && { tenantId }),
                ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
            };

            const [logs, total] = await Promise.all([
                ctx.db.auditLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                }),
                ctx.db.auditLog.count({ where }),
            ]);

            // Get tenant names for logs
            const tenantIds = [...new Set(logs.map(l => l.tenantId))];
            const tenants = await ctx.db.tenant.findMany({
                where: { id: { in: tenantIds } },
                select: { id: true, name: true },
            });
            const tenantMap = new Map(tenants.map(t => [t.id, t.name]));

            return {
                logs: logs.map((log) => ({
                    id: log.id,
                    tenantId: log.tenantId,
                    tenantName: tenantMap.get(log.tenantId) || 'Unknown',
                    userId: log.userId,
                    userName: log.user?.name || 'System',
                    userEmail: log.user?.email || null,
                    action: log.action,
                    entityType: log.entityType,
                    entityId: log.entityId,
                    oldValue: log.oldValue,
                    newValue: log.newValue,
                    metadata: log.metadata,
                    createdAt: log.createdAt,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }),

    // Get all system configurations
    getSystemConfig: adminProcedure.query(async ({ ctx }) => {
        const configs = await ctx.db.systemConfig.findMany({
            orderBy: { key: 'asc' },
        });

        // Convert to key-value object
        const configMap: Record<string, { value: string; label: string; type: string }> = {};
        for (const config of configs) {
            configMap[config.key] = {
                value: config.value,
                label: config.label,
                type: config.type,
            };
        }

        // Return with defaults if not set
        return {
            trial_days: configMap['trial_days'] || { value: '60', label: 'Dias de Trial (Legado)', type: 'number' },
            trial_days_founder: configMap['trial_days_founder'] || { value: '60', label: 'Dias Trial Fundador', type: 'number' },
            trial_days_standard: configMap['trial_days_standard'] || { value: '14', label: 'Dias Trial Padrão', type: 'number' },
            pro_monthly_price: configMap['pro_monthly_price'] || { value: '297', label: 'Preço Pro Mensal', type: 'number' },
            pro_yearly_price: configMap['pro_yearly_price'] || { value: '2970', label: 'Preço Pro Anual', type: 'number' },
            maintenance_mode: configMap['maintenance_mode'] || { value: 'false', label: 'Modo Manutenção', type: 'boolean' },
            new_signups_enabled: configMap['new_signups_enabled'] || { value: 'true', label: 'Novos Cadastros', type: 'boolean' },
            auto_suspend_on_expiry: configMap['auto_suspend_on_expiry'] || { value: 'true', label: 'Suspender ao Expirar', type: 'boolean' },
        };
    }),

    // Update system configuration
    updateSystemConfig: adminProcedure
        .input(
            z.object({
                configs: z.array(
                    z.object({
                        key: z.string(),
                        value: z.string(),
                        label: z.string(),
                        type: z.string().default('string'),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { configs } = input;

            // Upsert each config
            await Promise.all(
                configs.map((config) =>
                    ctx.db.systemConfig.upsert({
                        where: { key: config.key },
                        create: config,
                        update: { value: config.value, label: config.label, type: config.type },
                    })
                )
            );

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId: 'SYSTEM',
                userId: ctx.user?.id,
                action: 'ADMIN_UPDATE_CONFIG',
                entityType: 'SystemConfig',
                entityId: null,
                oldValue: null,
                newValue: configs,
            });

            return { success: true };
        }),

    // Update tenant pricing and founding member status
    updateTenantPricing: adminProcedure
        .input(
            z.object({
                tenantId: z.string(),
                customMonthlyPrice: z.number().min(0).nullable().optional(),
                isFoundingMember: z.boolean().optional(),
                billingCycleStart: z.string().transform(str => new Date(str)).optional(),
                plan: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tenantId, customMonthlyPrice, isFoundingMember, billingCycleStart, plan } = input;

            // Build update data object with only defined values
            const updateData: Record<string, unknown> = {};
            if (customMonthlyPrice !== undefined) {
                updateData.customMonthlyPrice = customMonthlyPrice;
            }
            if (isFoundingMember !== undefined) {
                updateData.isFoundingMember = isFoundingMember;
            }
            if (billingCycleStart !== undefined) {
                updateData.billingCycleStart = billingCycleStart;
            }
            if (plan !== undefined) {
                updateData.plan = plan;
            }

            const updated = await ctx.db.tenant.update({
                where: { id: tenantId },
                data: updateData,
            });

            await invalidateTenantCache(tenantId);

            // Update Clerk metadata for all users in this tenant if status changed
            if (isFoundingMember !== undefined) {
                const users = await ctx.db.user.findMany({
                    where: { tenantId },
                    select: { clerkId: true, role: true, id: true },
                });

                if (users.length > 0) {
                    try {
                        const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient());
                        await Promise.all(
                            users
                                .filter(u => u.clerkId)
                                .map(u =>
                                    clerk.users.updateUser(u.clerkId!, {
                                        publicMetadata: {
                                            tenantId,
                                            role: u.role,
                                            dbUserId: u.id,
                                            tenantStatus: updated.status,
                                            isFoundingMember: updated.isFoundingMember,
                                        },
                                    })
                                )
                        );
                    } catch (clerkError) {
                        // Ignore Clerk update errors to avoid failing the request
                        console.error('Clerk update failed', clerkError);
                    }
                }
            }

            return { success: true, tenant: updated };
        }),

    // Get founding member stats
    getFoundingMemberStats: publicProcedure.query(async ({ ctx }) => {
        const count = await ctx.db.tenant.count({
            where: { isFoundingMember: true },
        });
        return {
            count,
            limit: 15,
            remaining: Math.max(0, 15 - count),
        };
    }),

    // Get public pricing config (for landing page, no auth required)
    getPublicPricing: publicProcedure.query(async ({ ctx }) => {
        const configs = await ctx.db.systemConfig.findMany({
            where: {
                key: { in: ['pro_monthly_price', 'pro_yearly_price', 'trial_days_founder', 'trial_days_standard'] },
            },
        });

        const configMap = new Map(configs.map((c: { key: string; value: string }) => [c.key, c.value]));

        return {
            proMonthlyPrice: Number(configMap.get('pro_monthly_price') || '297'),
            proYearlyPrice: Number(configMap.get('pro_yearly_price') || '2970'),
            trialDaysFounder: Number(configMap.get('trial_days_founder') || '60'),
            trialDaysStandard: Number(configMap.get('trial_days_standard') || '14'),
        };
    }),

    // ==========================================
    // PROMO CODES MANAGEMENT
    // ==========================================

    // List all promo codes
    listPromoCodes: adminProcedure
        .input(z.object({
            page: z.number().min(1).default(1),
            limit: z.number().min(1).max(50).default(20),
            search: z.string().optional(),
            isActive: z.boolean().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const { page, limit, search, isActive } = input;
            const skip = (page - 1) * limit;

            const where = {
                ...(search && { code: { contains: search.toUpperCase(), mode: 'insensitive' as const } }),
                ...(isActive !== undefined && { isActive }),
            };

            const [promoCodes, total] = await Promise.all([
                ctx.db.promoCode.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        referrerTenant: {
                            select: { id: true, name: true },
                        },
                        _count: {
                            select: { usages: true, subscriptions: true },
                        },
                    },
                }),
                ctx.db.promoCode.count({ where }),
            ]);

            return {
                promoCodes: promoCodes.map((pc) => ({
                    id: pc.id,
                    code: pc.code,
                    discountPercent: pc.discountPercent,
                    monthlyDuration: pc.monthlyDuration,
                    yearlyDuration: pc.yearlyDuration,
                    isActive: pc.isActive,
                    maxUses: pc.maxUses,
                    usedCount: pc.usedCount,
                    expiresAt: pc.expiresAt,
                    referrerTenant: pc.referrerTenant,
                    usagesCount: pc._count.usages,
                    subscriptionsCount: pc._count.subscriptions,
                    createdAt: pc.createdAt,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }),

    // Create promo code for a tenant (referral)
    createPromoCode: adminProcedure
        .input(z.object({
            code: z.string().min(3).max(20).transform(s => s.toUpperCase()),
            referrerTenantId: z.string().optional(),
            discountPercent: z.number().min(1).max(100).default(15),
            monthlyDuration: z.number().min(1).max(12).default(1),
            yearlyDuration: z.number().min(1).max(12).default(3),
            maxUses: z.number().min(1).optional(),
            expiresAt: z.date().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if code already exists
            const existing = await ctx.db.promoCode.findUnique({
                where: { code: input.code },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Código ${input.code} já existe`,
                });
            }

            // Verify tenant exists if provided
            if (input.referrerTenantId) {
                const tenant = await ctx.db.tenant.findUnique({
                    where: { id: input.referrerTenantId },
                });
                if (!tenant) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Tenant não encontrado',
                    });
                }
            }

            const promoCode = await ctx.db.promoCode.create({
                data: {
                    code: input.code,
                    referrerTenantId: input.referrerTenantId,
                    discountPercent: input.discountPercent,
                    monthlyDuration: input.monthlyDuration,
                    yearlyDuration: input.yearlyDuration,
                    maxUses: input.maxUses,
                    expiresAt: input.expiresAt,
                },
            });

            return { success: true, promoCode };
        }),

    // Update promo code
    updatePromoCode: adminProcedure
        .input(z.object({
            id: z.string(),
            isActive: z.boolean().optional(),
            discountPercent: z.number().min(1).max(100).optional(),
            monthlyDuration: z.number().min(1).max(12).optional(),
            yearlyDuration: z.number().min(1).max(12).optional(),
            maxUses: z.number().min(1).nullable().optional(),
            expiresAt: z.date().nullable().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const promoCode = await ctx.db.promoCode.update({
                where: { id },
                data,
            });

            return { success: true, promoCode };
        }),

    // Delete promo code
    deletePromoCode: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.promoCode.delete({
                where: { id: input.id },
            });

            return { success: true };
        }),

    // Generate promo code for tenant (auto-generates code based on tenant name)
    generateTenantPromoCode: adminProcedure
        .input(z.object({
            tenantId: z.string(),
            discountPercent: z.number().min(1).max(100).default(15),
        }))
        .mutation(async ({ ctx, input }) => {
            const tenant = await ctx.db.tenant.findUnique({
                where: { id: input.tenantId },
                select: { name: true },
            });

            if (!tenant) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Tenant não encontrado',
                });
            }

            // Generate code from tenant name: FILMTECH15, AUTOBRILHO15, etc.
            const baseName = tenant.name
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 12);

            const code = `${baseName}${input.discountPercent}`;

            // Check if code already exists
            const existing = await ctx.db.promoCode.findUnique({
                where: { code },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Código ${code} já existe. Use um código personalizado.`,
                });
            }

            const promoCode = await ctx.db.promoCode.create({
                data: {
                    code,
                    referrerTenantId: input.tenantId,
                    discountPercent: input.discountPercent,
                    monthlyDuration: 1,
                    yearlyDuration: 3,
                },
            });

            return { success: true, promoCode };
        }),
});
