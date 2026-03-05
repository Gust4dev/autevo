import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const notificationRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(20).default(5),
            })
        )
        .query(async ({ ctx, input }) => {
            const userRole = String(ctx.user?.role || '');
            const isAdmin = ["ADMIN_SAAS", "OWNER", "MANAGER", "ADMIN", "admin"].includes(userRole);

            if (!ctx.tenantId) throw new TRPCError({ code: 'UNAUTHORIZED' });

            const whereClause: Prisma.NotificationLogWhereInput = {
                tenantId: ctx.tenantId,
            };

            if (!isAdmin) {
                const userOrders = await ctx.db.serviceOrder.findMany({
                    where: {
                        tenantId: ctx.tenantId,
                        OR: [
                            { assignedToId: ctx.user?.id },
                            { createdById: ctx.user?.id },
                        ]
                    },
                    select: { id: true }
                });

                const orderIds = userOrders.map(o => o.id);
                whereClause.orderId = { in: orderIds };
            }

            const items = await ctx.db.notificationLog.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'desc',
                },
                take: input.limit,
            });

            const unreadCount = await ctx.db.notificationLog.count({
                where: {
                    ...whereClause,
                    status: 'pending',
                },
            });

            return {
                items,
                unreadCount,
            };
        }),

    markAsRead: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.tenantId) throw new TRPCError({ code: 'UNAUTHORIZED' });

            return ctx.db.notificationLog.update({
                where: {
                    id: input.id,
                    tenantId: ctx.tenantId,
                },
                data: {
                    status: 'read',
                },
            });
        }),
});

