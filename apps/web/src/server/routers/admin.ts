import { z } from 'zod';
import { router, adminProcedure, publicProcedure, invalidateTenantCache } from '../trpc';
import { TRPCError } from '@trpc/server';
import { TenantStatus } from '@prisma/client';

// Admin router - only accessible by ADMIN_SAAS role
export const adminRouter = router({
    // Get dashboard statistics
    getDashboardStats: adminProcedure.query(async ({ ctx }) => {
        const [
            totalTenants,
            pendingActivation,
            trialTenants,
            activeTenants,
            suspendedTenants,
            canceledTenants,
        ] = await Promise.all([
            ctx.db.tenant.count(),
            ctx.db.tenant.count({ where: { status: 'PENDING_ACTIVATION' } }),
            ctx.db.tenant.count({ where: { status: 'TRIAL' } }),
            ctx.db.tenant.count({ where: { status: 'ACTIVE' } }),
            ctx.db.tenant.count({ where: { status: 'SUSPENDED' } }),
            ctx.db.tenant.count({ where: { status: 'CANCELED' } }),
        ]);

        // Calculate estimated revenue
        const TRIAL_PRICE = 97;
        const MONTHLY_PRICE = 297;
        const estimatedMonthlyRevenue = (trialTenants * TRIAL_PRICE) + (activeTenants * MONTHLY_PRICE);

        return {
            totalTenants,
            byStatus: {
                pendingActivation,
                trial: trialTenants,
                active: activeTenants,
                suspended: suspendedTenants,
                canceled: canceledTenants,
            },
            estimatedMonthlyRevenue,
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
                select: { status: true, name: true, trialEndsAt: true },
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

            return {
                success: true,
                tenant: {
                    id: updated.id,
                    name: updated.name,
                    trialEndsAt: updated.trialEndsAt,
                },
            };
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
            trial_days: configMap['trial_days'] || { value: '60', label: 'Dias de Trial', type: 'number' },
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

    // Get public pricing config (for landing page, no auth required)
    getPublicPricing: publicProcedure.query(async ({ ctx }) => {
        const configs = await ctx.db.systemConfig.findMany({
            where: {
                key: { in: ['pro_monthly_price', 'pro_yearly_price', 'trial_days'] },
            },
        });

        const configMap = new Map(configs.map((c: { key: string; value: string }) => [c.key, c.value]));

        return {
            proMonthlyPrice: Number(configMap.get('pro_monthly_price') || '297'),
            proYearlyPrice: Number(configMap.get('pro_yearly_price') || '2970'),
            trialDays: Number(configMap.get('trial_days') || '60'),
        };
    }),
});
