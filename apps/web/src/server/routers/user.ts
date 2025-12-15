import { z } from 'zod';
import { router, protectedProcedure, ownerProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clerkClient } from '@clerk/nextjs/server';

const userRoles = ['OWNER', 'MANAGER', 'MEMBER'] as const;

const inviteUserSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    role: z.enum(userRoles),
    defaultCommissionPercent: z.number().min(0).max(100).optional(),
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(userRoles).optional(),
    phone: z.string().optional(),
    defaultCommissionPercent: z.number().min(0).max(100).optional(),
});

export const userRouter = router({
    // List all users for the tenant
    list: managerProcedure.query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            where: { tenantId: ctx.tenantId! },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                phone: true,
                defaultCommissionPercent: true,
                isActive: true,
                createdAt: true,
            },
        });

        return users;
    }),

    // List users for select dropdowns (simplified)
    listForSelect: protectedProcedure.query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            where: {
                tenantId: ctx.tenantId!,
                isActive: true,
            },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        return users;
    }),

    // Get single user details
    getById: managerProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
                include: {
                    _count: {
                        select: {
                            assignedOrders: true,
                            commissions: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Usuário não encontrado',
                });
            }

            return user;
        }),

    // Invite new user via Clerk
    invite: ownerProcedure
        .input(inviteUserSchema)
        .mutation(async ({ ctx, input }) => {
            // Check if email already exists in tenant
            const existing = await ctx.db.user.findFirst({
                where: {
                    email: input.email,
                    tenantId: ctx.tenantId!,
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Este email já está cadastrado no sistema',
                });
            }

            // Get tenant info for invitation
            const tenant = await ctx.db.tenant.findUnique({
                where: { id: ctx.tenantId! },
                select: { name: true, slug: true },
            });

            if (!tenant) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Tenant não encontrado',
                });
            }

            try {
                // Create Clerk invitation
                const clerk = await clerkClient();
                const invitation = await clerk.invitations.createInvitation({
                    emailAddress: input.email,
                    publicMetadata: {
                        tenantId: ctx.tenantId,
                        role: input.role,
                        name: input.name,
                        defaultCommissionPercent: input.defaultCommissionPercent || 0,
                    },
                    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
                });

                return {
                    success: true,
                    invitationId: invitation.id,
                    email: input.email,
                };
            } catch (error) {
                console.error('Clerk invitation error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Erro ao enviar convite. Tente novamente.',
                });
            }
        }),

    // Update user info
    update: ownerProcedure
        .input(z.object({ id: z.string(), data: updateUserSchema }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.user.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Usuário não encontrado',
                });
            }

            // Can't change own role
            if (input.data.role && existing.id === ctx.user!.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Você não pode alterar seu próprio cargo',
                });
            }

            const user = await ctx.db.user.update({
                where: { id: input.id },
                data: input.data,
            });

            return user;
        }),

    // Deactivate user
    deactivate: ownerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.user.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Usuário não encontrado',
                });
            }

            // Can't deactivate yourself
            if (existing.id === ctx.user!.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Você não pode desativar sua própria conta',
                });
            }

            const user = await ctx.db.user.update({
                where: { id: input.id },
                data: { isActive: false },
            });

            return user;
        }),

    // Reactivate user
    reactivate: ownerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.user.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Usuário não encontrado',
                });
            }

            const user = await ctx.db.user.update({
                where: { id: input.id },
                data: { isActive: true },
            });

            return user;
        }),

    // Get current user info
    me: protectedProcedure.query(async ({ ctx }) => {
        return ctx.user;
    }),

    // DevTools: Switch User Role
    switchRole: protectedProcedure
        .input(z.object({
            targetRole: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'ADMIN_SAAS']),
        }))
        .mutation(async ({ ctx, input }) => {
            // Safety Check: Only allow in development or if user is ADMIN_SAAS
            const isDev = process.env.NODE_ENV === 'development';
            const isAdmin = ctx.user?.role === 'ADMIN_SAAS';

            if (!isDev && !isAdmin) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'DevTools only',
                });
            }

            const clerk = await clerkClient();

            // 1. Update Database
            await ctx.db.user.update({
                where: { id: ctx.user!.id },
                data: { role: input.targetRole as any }, // Cast to avoid TS issues if enum mismatch temporarily
            });

            // 2. Update Clerk Metadata
            await clerk.users.updateUser(ctx.user!.clerkId, {
                publicMetadata: {
                    ...ctx.user!.publicMetadata,
                    role: input.targetRole,
                },
            });

            return { success: true, newRole: input.targetRole };
        }),
});
