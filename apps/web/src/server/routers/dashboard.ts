import { router, protectedProcedure, ownerProcedure, managerProcedure } from '../trpc';

export const dashboardRouter = router({
    // Get financial statistics for the dashboard
    getFinancialStats: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Get all payments in current month (actual revenue)
        const monthPayments = await ctx.db.payment.aggregate({
            where: {
                order: {
                    tenantId: ctx.tenantId!,
                },
                paidAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            _sum: { amount: true },
            _count: true,
        });

        // Count orders completed this month (for average ticket calculation)
        const monthOrders = await ctx.db.serviceOrder.count({
            where: {
                tenantId: ctx.tenantId!,
                status: 'CONCLUIDO',
                completedAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        // Calculate receivables (orders not fully paid, excluding CANCELADO)
        const ordersWithPayments = await ctx.db.serviceOrder.findMany({
            where: {
                tenantId: ctx.tenantId!,
                status: {
                    notIn: ['CANCELADO'],
                },
            },
            select: {
                id: true,
                total: true,
                payments: {
                    select: {
                        amount: true,
                    },
                },
            },
        });

        // Calculate total receivables
        let receivables = 0;
        for (const order of ordersWithPayments) {
            const orderTotal = Number(order.total);
            const orderPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const orderBalance = orderTotal - orderPaid;
            if (orderBalance > 0.01) { // EPSILON
                receivables += orderBalance;
            }
        }

        // Calculate metrics
        const revenue = Number(monthPayments._sum.amount) || 0;
        const avgTicket = monthOrders > 0 ? revenue / monthOrders : 0;

        return {
            revenue,
            avgTicket,
            receivables,
            paymentCount: monthPayments._count,
            completedOrders: monthOrders,
        };
    }),

    // Get quick stats for the main dashboard (existing stats + new ones)
    getQuickStats: protectedProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [todayOrders, inProgress, monthRevenue, pendingPayments] = await Promise.all([
            // Orders scheduled for today
            ctx.db.serviceOrder.count({
                where: {
                    tenantId: ctx.tenantId!,
                    scheduledAt: { gte: today, lt: tomorrow },
                },
            }),
            // Orders in progress
            ctx.db.serviceOrder.count({
                where: {
                    tenantId: ctx.tenantId!,
                    status: { in: ['EM_VISTORIA', 'EM_EXECUCAO'] },
                },
            }),
            // Month revenue from payments
            ctx.db.payment.aggregate({
                where: {
                    order: { tenantId: ctx.tenantId! },
                    paidAt: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
            // Orders awaiting payment
            ctx.db.serviceOrder.count({
                where: {
                    tenantId: ctx.tenantId!,
                    status: 'AGUARDANDO_PAGAMENTO',
                },
            }),
        ]);

        return {
            todayOrders,
            inProgress,
            monthRevenue: Number(monthRevenue._sum.amount) || 0,
            pendingPayments,
        };
    }),
});
