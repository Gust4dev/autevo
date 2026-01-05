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
});

export const tenantRouter = router({
    updateSetup: protectedProcedure
        .input(setupSchema)
        .mutation(async ({ ctx, input }) => {
            const isOwnerOrAdmin = ctx.user?.role === 'OWNER' || ctx.user?.role === 'ADMIN_SAAS';
            const isInitialSetup = !ctx.user?.jobTitle;

            if (!isOwnerOrAdmin && !isInitialSetup) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Apenas administradores podem alterar configurações',
                });
            }

            await ctx.db.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: ctx.user!.id },
                    data: { jobTitle: input.jobTitle },
                });

                await tx.tenant.update({
                    where: { id: ctx.user!.tenantId! },
                    data: {
                        name: input.tenantName,
                        primaryColor: input.primaryColor,
                        logo: input.logo,
                        email: input.email || null,
                        phone: input.phone,
                        address: input.address,
                    },
                });
            });

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

        const result = await ctx.db.$transaction(async (tx) => {
            const newTenant = await tx.tenant.create({
                data: { name: 'Minha Empresa', slug, status: 'ACTIVE' },
            });

            const updatedUser = await tx.user.update({
                where: { id: ctx.user!.id },
                data: { tenantId: newTenant.id, role: 'OWNER', status: 'ACTIVE' },
            });

            return { tenant: newTenant, user: updatedUser };
        });

        if (ctx.user.clerkId) {
            const { clerkClient } = await import('@clerk/nextjs/server');
            const clerk = await clerkClient();
            await clerk.users.updateUser(ctx.user.clerkId, {
                publicMetadata: {
                    tenantId: result.tenant.id,
                    role: 'OWNER',
                    dbUserId: ctx.user.id,
                    needsOnboarding: false,
                },
            }).catch(console.error);

            const { invalidateUserCache } = await import('@/lib/user-cache');
            invalidateUserCache(ctx.user.clerkId);
        }

        return { success: true, tenantId: result.tenant.id };
    }),
});
