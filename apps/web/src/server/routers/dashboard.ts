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

    // Get Chart Data (Daily Revenue)
    getFinancialChartData: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
        // Last 30 days or current month? Let's do current month for now.
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Fetch payments grouped by day
        // Prisma doesn't support "groupBy" date easily with SQLite/Postgres seamlessly without raw query
        // But for portability, we can fetch all payments and aggregate in JS (assuming volume isn't massive yet)
        const payments = await ctx.db.payment.findMany({
            where: {
                order: { tenantId: ctx.tenantId! },
                paidAt: { gte: startOfMonth, lte: endOfMonth },
            },
            select: {
                paidAt: true,
                amount: true,
            },
            orderBy: { paidAt: 'asc' },
        });

        // Group by day
        const dailyRevenue = new Map<string, number>();
        // Initialize all days in month
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            const dayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            dailyRevenue.set(dayStr, 0);
        }

        for (const p of payments) {
            const dayStr = p.paidAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            dailyRevenue.set(dayStr, (dailyRevenue.get(dayStr) || 0) + Number(p.amount));
        }

        const chartData = Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
            date,
            revenue,
        }));

        return chartData;
    }),

    // Get Team Financials
    getTeamFinancials: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all active users/employees
        const users = await ctx.db.user.findMany({
            where: {
                tenantId: ctx.tenantId!,
                // status: { not: 'INACTIVE' }, // Show all active/invited
                isActive: true, // Legacy fallback
            },
            select: {
                id: true,
                name: true,
                role: true,
                jobTitle: true,
                salary: true,
                avatarUrl: true,
                // Get commissions for this month
                commissions: {
                    where: {
                        calculatedAt: { gte: startOfMonth },
                    },
                    select: {
                        commissionValue: true,
                    },
                },
                // Get orders assigned and completed this month (Revenue Generated)
                assignedOrders: {
                    where: {
                        status: 'CONCLUIDO',
                        completedAt: { gte: startOfMonth },
                    },
                    select: {
                        total: true,
                    },
                },
            },
        });

        const teamStats = users.map(user => {
            const fixedSalary = Number(user.salary) || 0;
            const commissions = user.commissions.reduce((sum, c) => sum + Number(c.commissionValue), 0);
            const totalPayout = fixedSalary + commissions;

            const revenueGenerated = user.assignedOrders.reduce((sum, o) => sum + Number(o.total), 0);
            const ordersCount = user.assignedOrders.length;

            return {
                id: user.id,
                name: user.name,
                role: user.role,
                jobTitle: user.jobTitle || 'N/A',
                avatarUrl: user.avatarUrl,
                fixedSalary,
                commissions,
                totalPayout,
                revenueGenerated,
                ordersCount,
                roi: totalPayout > 0 ? (revenueGenerated / totalPayout) : 0, // Return on Investment
            };
        });

        // Calculate Totals
        const totalPayroll = teamStats.reduce((sum, u) => sum + u.totalPayout, 0);
        const totalFixed = teamStats.reduce((sum, u) => sum + u.fixedSalary, 0);
        const totalCommissions = teamStats.reduce((sum, u) => sum + u.commissions, 0);

        return {
            users: teamStats,
            totalPayroll,
            totalFixed,
            totalCommissions,
        };
    }),
});
