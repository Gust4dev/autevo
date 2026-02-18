import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { benchmark, getAllStats, clearStats, runMultiple } from '@/lib/benchmark';

export const benchmarkRouter = router({
    runDashboardBenchmarks: adminProcedure
        .input(z.object({ iterations: z.number().min(1).max(20).default(5) }))
        .mutation(async ({ ctx, input }) => {
            const tenantId = ctx.tenantId;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            clearStats();

            await runMultiple('dashboard.monthPaymentsAggregate', async () => {
                return ctx.db.payment.aggregate({
                    where: {
                        order: { tenantId: tenantId! },
                        paidAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                    _sum: { amount: true },
                    _count: true,
                });
            }, input.iterations);

            await runMultiple('dashboard.monthOrdersCount', async () => {
                return ctx.db.serviceOrder.count({
                    where: {
                        tenantId: tenantId!,
                        status: 'CONCLUIDO',
                        completedAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                });
            }, input.iterations);

            await runMultiple('dashboard.ordersWithPayments', async () => {
                return ctx.db.serviceOrder.findMany({
                    where: {
                        tenantId: tenantId!,
                        status: { notIn: ['CANCELADO'] },
                    },
                    select: {
                        id: true,
                        total: true,
                        payments: { select: { amount: true } },
                    },
                });
            }, input.iterations);

            await runMultiple('dashboard.todayOrdersCount', async () => {
                return ctx.db.serviceOrder.count({
                    where: {
                        tenantId: tenantId!,
                        scheduledAt: { gte: today, lt: tomorrow },
                    },
                });
            }, input.iterations);

            await runMultiple('dashboard.inProgressCount', async () => {
                return ctx.db.serviceOrder.count({
                    where: {
                        tenantId: tenantId!,
                        status: { in: ['EM_VISTORIA', 'EM_EXECUCAO'] },
                    },
                });
            }, input.iterations);

            await runMultiple('dashboard.customerCount', async () => {
                return ctx.db.customer.count({
                    where: { tenantId: tenantId! },
                });
            }, input.iterations);

            await runMultiple('dashboard.recentOrders', async () => {
                return ctx.db.serviceOrder.findMany({
                    where: { tenantId: tenantId! },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        code: true,
                        status: true,
                        total: true,
                        createdAt: true,
                        vehicle: {
                            select: {
                                brand: true,
                                model: true,
                                customer: { select: { name: true } },
                            },
                        },
                        items: {
                            select: {
                                id: true,
                                service: { select: { name: true } },
                            },
                        },
                    },
                });
            }, input.iterations);

            await runMultiple('dashboard.allPaymentsForChart', async () => {
                return ctx.db.payment.findMany({
                    where: {
                        order: { tenantId: tenantId! },
                        paidAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                    select: { paidAt: true, amount: true },
                    orderBy: { paidAt: 'asc' },
                });
            }, input.iterations);

            await runMultiple('dashboard.usersWithCommissions', async () => {
                return ctx.db.user.findMany({
                    where: { tenantId: tenantId!, isActive: true },
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        jobTitle: true,
                        salary: true,
                        avatarUrl: true,
                        commissions: {
                            where: { calculatedAt: { gte: startOfMonth } },
                            select: { commissionValue: true },
                        },
                        assignedOrders: {
                            where: { status: 'CONCLUIDO', completedAt: { gte: startOfMonth } },
                            select: { total: true },
                        },
                    },
                });
            }, input.iterations);

            return getAllStats();
        }),

    runOrderBenchmarks: adminProcedure
        .input(z.object({ iterations: z.number().min(1).max(20).default(5) }))
        .mutation(async ({ ctx, input }) => {
            const tenantId = ctx.tenantId;

            clearStats();

            await runMultiple('order.list', async () => {
                return ctx.db.serviceOrder.findMany({
                    where: { tenantId: tenantId! },
                    skip: 0,
                    take: 10,
                    orderBy: { scheduledAt: 'asc' },
                    include: {
                        vehicle: {
                            include: {
                                customer: { select: { id: true, name: true } },
                            },
                        },
                        items: {
                            include: { service: { select: { name: true } } },
                        },
                        assignedTo: { select: { name: true } },
                    },
                });
            }, input.iterations);

            await runMultiple('order.listAll', async () => {
                return ctx.db.serviceOrder.findMany({
                    where: { tenantId: tenantId! },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        vehicle: {
                            include: { customer: { select: { name: true } } },
                        },
                        assignedTo: { select: { name: true } },
                    },
                });
            }, input.iterations);

            await runMultiple('order.count', async () => {
                return ctx.db.serviceOrder.count({
                    where: { tenantId: tenantId! },
                });
            }, input.iterations);

            return getAllStats();
        }),

    runCustomerBenchmarks: adminProcedure
        .input(z.object({ iterations: z.number().min(1).max(20).default(5) }))
        .mutation(async ({ ctx, input }) => {
            const tenantId = ctx.tenantId;

            clearStats();

            await runMultiple('customer.list', async () => {
                return ctx.db.customer.findMany({
                    where: { tenantId: tenantId!, deletedAt: null },
                    skip: 0,
                    take: 20,
                    orderBy: { name: 'asc' },
                    include: {
                        _count: { select: { vehicles: true } },
                    },
                });
            }, input.iterations);

            await runMultiple('customer.count', async () => {
                return ctx.db.customer.count({
                    where: { tenantId: tenantId!, deletedAt: null },
                });
            }, input.iterations);

            await runMultiple('customer.listAll', async () => {
                return ctx.db.customer.findMany({
                    where: { tenantId: tenantId!, deletedAt: null },
                    orderBy: { name: 'asc' },
                    include: {
                        _count: { select: { vehicles: true } },
                    },
                });
            }, input.iterations);

            return getAllStats();
        }),

    getStats: adminProcedure.query(() => {
        return getAllStats();
    }),

    clear: adminProcedure.mutation(() => {
        clearStats();
        return { success: true };
    }),

    analyzeBottlenecks: adminProcedure.query(async ({ ctx }) => {
        const tenantId = ctx.tenantId;

        const { result: orderCount } = await benchmark('analyze.orderCount', () =>
            ctx.db.serviceOrder.count({ where: { tenantId: tenantId! } })
        ) as { result: number };

        const { result: customerCount } = await benchmark('analyze.customerCount', () =>
            ctx.db.customer.count({ where: { tenantId: tenantId! } })
        ) as { result: number };

        const { result: paymentCount } = await benchmark('analyze.paymentCount', () =>
            ctx.db.payment.count({ where: { order: { tenantId: tenantId! } } })
        ) as { result: number };

        const bottlenecks: Array<{ area: string; issue: string; severity: 'high' | 'medium' | 'low'; recommendation: string }> = [];

        if (orderCount > 500) {
            bottlenecks.push({
                area: 'dashboard.getFinancialStats',
                issue: `Fetching ${orderCount} orders to calculate receivables`,
                severity: 'high',
                recommendation: 'Use raw SQL aggregation instead of fetching all records',
            });
        }

        if (orderCount > 200) {
            bottlenecks.push({
                area: 'order.listAll',
                issue: `Fetching all ${orderCount} orders without pagination`,
                severity: 'medium',
                recommendation: 'Add pagination or limit to listAll endpoint',
            });
        }

        if (paymentCount > 500) {
            bottlenecks.push({
                area: 'dashboard.getFinancialChartData',
                issue: `Fetching ${paymentCount} payments and grouping in JS`,
                severity: 'medium',
                recommendation: 'Use raw SQL with GROUP BY DATE(paidAt)',
            });
        }

        return {
            counts: { orders: orderCount, customers: customerCount, payments: paymentCount },
            bottlenecks,
            stats: getAllStats(),
        };
    }),
});
