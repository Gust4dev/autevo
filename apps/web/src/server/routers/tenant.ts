import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const setupSchema = z.object({
    jobTitle: z.string().min(2, 'Informe seu cargo'),
    tenantName: z.string().min(2, 'Informe o nome da empresa'),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
    logo: z.string().optional().nullable(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    tosAccepted: z.boolean().optional(),
});

export const tenantRouter = router({
    updateSetup: protectedProcedure
        .input(setupSchema)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.user || !ctx.user.tenantId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado ou sem tenant' });
            }

            const userId = ctx.user.id;
            const tenantId = ctx.user.tenantId;
            const clerkId = ctx.user.clerkId;
            const role = ctx.user.role;
            const jobTitle = ctx.user.jobTitle;

            const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN_SAAS';
            const isInitialSetup = !jobTitle;

            if (!isOwnerOrAdmin && !isInitialSetup) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Apenas administradores podem alterar configurações',
                });
            }

            if (isInitialSetup && !input.tosAccepted) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Você deve aceitar os Termos de Uso para continuar',
                });
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ctx.db.$transaction(async (tx: any) => {
                await tx.user.update({
                    where: { id: userId },
                    data: { jobTitle: input.jobTitle },
                });

                const tenantData: Record<string, unknown> = {
                    name: input.tenantName,
                    primaryColor: input.primaryColor,
                    logo: input.logo,
                    email: input.email || null,
                    phone: input.phone,
                    address: input.address,
                };

                if (isInitialSetup && input.tosAccepted) {
                    tenantData.tosAcceptedAt = new Date();
                    tenantData.tosVersion = 'v1.0';
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tenantData.tosAcceptedByIp = (ctx as any).req?.headers?.['x-forwarded-for'] as string || 'unknown';
                }

                await tx.tenant.update({
                    where: { id: tenantId },
                    data: tenantData,
                });
            });

            // Invalidate ALL relevant caches to prevent redirect loops after setup
            // 1. In-memory user cache (for tRPC context)
            if (clerkId) {
                const { invalidateUserCache } = await import('@/lib/user-cache');
                invalidateUserCache(clerkId);

                // Sync tosVersion to Clerk publicMetadata for middleware check
                if (isInitialSetup && input.tosAccepted) {
                    const { clerkClient } = await import('@clerk/nextjs/server');
                    const clerk = await clerkClient();
                    const currentUser = await clerk.users.getUser(clerkId);
                    await clerk.users.updateUser(clerkId, {
                        publicMetadata: {
                            ...currentUser.publicMetadata,
                            tosVersion: 'v1.0',
                        },
                    }).catch(() => { });
                }
            }

            // 2. Tenant status cache (Redis) - THIS IS CRITICAL
            const { invalidateTenantCache } = await import('../trpc');
            await invalidateTenantCache(tenantId);

            // 3. Next.js unstable_cache (used by cached-queries.ts in dashboard layout)
            const { revalidateTag } = await import('next/cache');
            revalidateTag('user');

            return { success: true };
        }),

    createForUser: protectedProcedure.mutation(async ({ ctx }) => {
        if (!ctx.user) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' });
        }

        if (ctx.user.role !== 'MEMBER') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'User already has company access' });
        }

        const email = ctx.user.email;
        const slug = `${email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}`;
        const userId = ctx.user.id;
        const clerkId = ctx.user.clerkId;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await ctx.db.$transaction(async (tx: any) => {
            const newTenant = await tx.tenant.create({
                data: { name: 'Minha Empresa', slug, status: 'ACTIVE' },
            });

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { tenantId: newTenant.id, role: 'OWNER', status: 'ACTIVE' },
            });

            return { tenant: newTenant, user: updatedUser };
        });

        if (clerkId) {
            const { clerkClient } = await import('@clerk/nextjs/server');
            const clerk = await clerkClient();
            await clerk.users.updateUser(clerkId, {
                publicMetadata: {
                    tenantId: result.tenant.id,
                    role: 'OWNER',
                    dbUserId: userId,
                    needsOnboarding: false,
                },
            }).catch(() => { });

            const { invalidateUserCache } = await import('@/lib/user-cache');
            invalidateUserCache(clerkId);
        }

        return { success: true, tenantId: result.tenant.id };
    }),

    setInitialSequence: protectedProcedure
        .input(z.object({
            prefix: z.string().min(1).max(10).regex(/^[A-Z0-9-]+$/, 'Prefixo deve conter apenas letras maiúsculas, números e hífens'),
            startValue: z.number().min(0).max(99999).default(0),
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user?.role !== 'OWNER' && ctx.user?.role !== 'ADMIN_SAAS') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Apenas o proprietário pode configurar a sequência',
                });
            }

            const tenantId = ctx.tenantId;
            if (!tenantId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const existingOrders = await ctx.db.serviceOrder.count({
                where: { tenantId },
            });

            if (existingOrders > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Não é possível alterar a sequência após criar ordens de serviço',
                });
            }

            await ctx.db.tenantSequence.upsert({
                where: { tenantId },
                create: {
                    tenantId,
                    prefix: input.prefix,
                    currentValue: input.startValue,
                },
                update: {
                    prefix: input.prefix,
                    currentValue: input.startValue,
                },
            });

            return { success: true };
        }),
});
