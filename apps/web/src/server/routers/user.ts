import { z } from 'zod';
import { router, protectedProcedure, ownerProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { clerkClient } from '@clerk/nextjs/server';
import { invalidateUserCache } from '@/lib/user-cache';

const userRoles = ['OWNER', 'MANAGER', 'MEMBER'] as const;

const inviteUserSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    role: z.enum(userRoles),
    defaultCommissionPercent: z.number().min(0).max(100).optional(),
    jobTitle: z.string().optional(),
    salary: z.number().min(0).optional(),
    pixKey: z.string().optional(),
    admissionDate: z.date().optional(),
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(userRoles).optional(),
    phone: z.string().optional(),
    defaultCommissionPercent: z.number().min(0).max(100).optional(),
    jobTitle: z.string().optional(),
    salary: z.number().min(0).optional(),
    pixKey: z.string().optional(),
    admissionDate: z.date().optional(),
});

export const userRouter = router({
    list: managerProcedure.query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            where: { tenantId: ctx.tenantId! },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarUrl: true,
                phone: true,
                jobTitle: true,
                salary: true,
                admissionDate: true,
                defaultCommissionPercent: true,
                isActive: true,
                createdAt: true,
            },
        });

        return users;
    }),

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

    invite: ownerProcedure
        .input(inviteUserSchema)
        .mutation(async ({ ctx, input }) => {
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

            if (!process.env.CLERK_SECRET_KEY) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'CONFIG_ERROR: CLERK_SECRET_KEY não encontrada no servidor.',
                });
            }

            let appUrl = process.env.NEXT_PUBLIC_APP_URL;
            if (!appUrl && process.env.NODE_ENV === 'development') {
                appUrl = 'http://localhost:3000';
            }

            if (!appUrl) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'CONFIG_ERROR: NEXT_PUBLIC_APP_URL não encontrada no servidor.',
                });
            }

            const clerk = await clerkClient();

            const dbUser = await ctx.db.user.create({
                data: {
                    tenantId: ctx.tenantId!,
                    email: input.email,
                    name: input.name,
                    role: input.role,
                    status: 'INVITED',
                    jobTitle: input.jobTitle,
                    salary: input.salary,
                    pixKey: input.pixKey,
                    admissionDate: input.admissionDate,
                    defaultCommissionPercent: input.defaultCommissionPercent,
                },
            });

            try {
                const invitation = await clerk.invitations.createInvitation({
                    emailAddress: input.email,
                    publicMetadata: {
                        tenantId: ctx.tenantId,
                        role: input.role,
                        dbUserId: dbUser.id,
                    },
                    redirectUrl: `${appUrl}/sign-up`,
                });

                return {
                    success: true,
                    invitationId: invitation.id,
                    email: input.email,
                    dbUserId: dbUser.id,
                };
            } catch (error: any) {
                const isDuplicate = error?.errors?.some((e: any) => e.code === 'duplicate_record');

                if (isDuplicate) {
                    await ctx.db.user.delete({ where: { id: dbUser.id } }).catch(() => { });

                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Este e-mail já possui um convite pendente enviando pelo Clerk. Verifique no painel do Clerk ou peça para o usuário checar o e-mail.',
                    });
                }

                await ctx.db.user.delete({ where: { id: dbUser.id } }).catch(() => { });

                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (error.errors && Array.isArray(error.errors)) {
                    errorMessage = error.errors.map((e: any) => e.longMessage || e.message).join(', ');
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Clerk: ${errorMessage}`,
                });
            }
        }),

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

            if (input.data.role && input.data.role !== existing.role) {
                const { createAuditLog } = await import('@/lib/audit');
                await createAuditLog({
                    tenantId: ctx.tenantId!,
                    userId: ctx.user!.id,
                    action: 'user.role_changed',
                    entityType: 'User',
                    entityId: input.id,
                    oldValue: { role: existing.role },
                    newValue: { role: input.data.role },
                }).catch(() => { });

                invalidateUserCache(existing.clerkId!);
            }

            return user;
        }),

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

    me: protectedProcedure.query(async ({ ctx }) => {
        return ctx.user;
    }),

    confirmWaitingForInvite: protectedProcedure.mutation(async ({ ctx }) => {
        if (!ctx.user) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
        }

        await ctx.db.user.update({
            where: { id: ctx.user.id },
            data: {
                status: 'INVITED',
            },
        });

        if (ctx.user.clerkId) {
            const clerk = await clerkClient();
            await clerk.users.updateUser(ctx.user.clerkId, {
                publicMetadata: {
                    tenantId: ctx.user.tenantId,
                    role: ctx.user.role,
                    dbUserId: ctx.user.id,
                    needsOnboarding: false,
                    awaitingInvite: true,
                },
            }).catch(() => { });

            invalidateUserCache(ctx.user.clerkId);
        }

        return { success: true };
    }),
    delete: ownerProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findFirst({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId!,
                },
            });

            if (!user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Usuário não encontrado',
                });
            }

            if (user.id === ctx.user!.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Você não pode excluir sua própria conta',
                });
            }

            if (user.clerkId) {
                const clerk = await clerkClient();
                try {
                    await clerk.users.deleteUser(user.clerkId);
                } catch (error) {
                    console.error('Failed to delete user in Clerk:', error);
                    // Continue to delete in DB even if Clerk fails (or user mostly already deleted)
                }
            }

            await ctx.db.user.delete({
                where: { id: user.id },
            });

            const { createAuditLog } = await import('@/lib/audit');
            await createAuditLog({
                tenantId: ctx.tenantId!,
                userId: ctx.user!.id,
                action: 'user.deleted',
                entityType: 'User',
                entityId: user.id,
                oldValue: { name: user.name, email: user.email, role: user.role },
            }).catch(() => { });

            return { success: true };
        }),
});
