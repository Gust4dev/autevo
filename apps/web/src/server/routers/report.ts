/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { router, managerProcedure } from '../trpc';

export const reportRouter = router({
    // Top Services by revenue and volume
    getTopServices: managerProcedure
        .input(z.object({
            from: z.date().optional(),
            to: z.date().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const now = new Date();
            const from = input?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
            const to = input?.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const items = await ctx.db.orderItem.findMany({
                where: {
                    order: {
                        tenantId: ctx.tenantId!,
                        status: 'CONCLUIDO',
                        completedAt: { gte: from, lte: to },
                    },
                    serviceId: { not: null },
                },
                select: {
                    serviceId: true,
                    price: true,
                    quantity: true,
                },
            });

            // Aggregate in memory
            const serviceAggregation = new Map<string, { totalRevenue: number, count: number }>();

            for (const item of items) {
                const sid = item.serviceId!;
                const current = serviceAggregation.get(sid) || { totalRevenue: 0, count: 0 };
                current.totalRevenue += Number(item.price) * item.quantity;
                current.count += 1;
                serviceAggregation.set(sid, current);
            }

            const topServices = Array.from(serviceAggregation.entries())
                .map(([serviceId, stats]) => ({
                    serviceId,
                    ...stats,
                }))
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 10);

            // Fetch service names
            const serviceDetails = await ctx.db.service.findMany({
                where: {
                    id: { in: topServices.map(s => s.serviceId) },
                },
                select: { id: true, name: true },
            });

            return topServices.map(s => ({
                id: s.serviceId,
                name: serviceDetails.find(d => d.id === s.serviceId)?.name || 'Desconhecido',
                totalRevenue: s.totalRevenue,
                count: s.count,
            }));
        }),

    // Top Customers by revenue and orders
    getCustomerReport: managerProcedure
        .input(z.object({
            from: z.date().optional(),
            to: z.date().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const now = new Date();
            const from = input?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
            const to = input?.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const customers = await ctx.db.serviceOrder.groupBy({
                by: ['customerId'],
                where: {
                    tenantId: ctx.tenantId!,
                    status: 'CONCLUIDO',
                    completedAt: { gte: from, lte: to },
                    customerId: { not: null },
                },
                _sum: { total: true },
                _count: { _all: true },
                orderBy: {
                    _sum: { total: 'desc' },
                },
                take: 20,
            });

            const customerDetails = await ctx.db.customer.findMany({
                where: {
                    id: { in: customers.map(c => c.customerId!) },
                },
                select: { id: true, name: true, phone: true },
            });

            return customers.map(c => ({
                id: c.customerId,
                name: customerDetails.find(d => d.id === c.customerId)?.name || 'N/A',
                phone: customerDetails.find(d => d.id === c.customerId)?.phone || '',
                totalSpent: Number(c._sum?.total) || 0,
                orderCount: c._count?._all || 0,
            }));
        }),

    // Month-over-Month comparison
    getGrowthMetrics: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const startOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLast = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const [currentStats, lastStats] = await Promise.all([
            // Current Month
            ctx.db.payment.aggregate({
                where: {
                    order: {
                        tenantId: ctx.tenantId!,
                        status: { not: 'CANCELADO' },
                    },
                    paidAt: { gte: startOfCurrent },
                },
                _sum: { amount: true },
                _count: true,
            }),
            // Previous Month
            ctx.db.payment.aggregate({
                where: {
                    order: {
                        tenantId: ctx.tenantId!,
                        status: { not: 'CANCELADO' },
                    },
                    paidAt: { gte: startOfLast, lte: endOfLast },
                },
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        const currentRevenue = Number(currentStats._sum.amount) || 0;
        const lastRevenue = Number(lastStats._sum.amount) || 0;

        const revenueGrowth = lastRevenue > 0
            ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
            : 0;

        return {
            currentMonth: {
                revenue: currentRevenue,
                paymentCount: currentStats._count,
            },
            lastMonth: {
                revenue: lastRevenue,
                paymentCount: lastStats._count,
            },
            revenueGrowth,
        };
    }),
});
