import { z } from 'zod';
import { router, protectedProcedure, ownerProcedure, managerProcedure } from '../trpc';

export const dashboardRouter = router({
    getFinancialStats: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

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

        let receivables = 0;
        for (const order of ordersWithPayments) {
            const orderTotal = Number(order.total);
            const orderPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const orderBalance = orderTotal - orderPaid;
            if (orderBalance > 0.01) {
                receivables += orderBalance;
            }
        }

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

    getQuickStats: protectedProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [todayOrders, inProgress, monthRevenue, pendingPayments] = await Promise.all([
            ctx.db.serviceOrder.count({
                where: {
                    tenantId: ctx.tenantId!,
                    scheduledAt: { gte: today, lt: tomorrow },
                },
            }),
            ctx.db.serviceOrder.count({
                where: {
                    tenantId: ctx.tenantId!,
                    status: { in: ['EM_VISTORIA', 'EM_EXECUCAO'] },
                },
            }),
            ctx.db.payment.aggregate({
                where: {
                    order: { tenantId: ctx.tenantId! },
                    paidAt: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
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

    getDashboardOverview: protectedProcedure
        .input(z.object({
            from: z.date().optional(),
            to: z.date().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const now = new Date();
            const from = input?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
            const to = input?.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);

            const isMember = ctx.user?.role === 'MEMBER';
            const baseWhere: { tenantId: string; assignedToId?: string } = { tenantId: ctx.tenantId! };
            if (isMember) {
                baseWhere.assignedToId = ctx.user!.id;
            }

            const [
                todayOrdersCount,
                inProgressCount,
                periodRevenue,
                pendingPaymentsCount,
                customerCount,
                recentOrders,
                todaySchedule,
                tenant
            ] = await Promise.all([
                ctx.db.serviceOrder.count({
                    where: {
                        ...baseWhere,
                        scheduledAt: { gte: today, lt: tomorrow },
                    },
                }),
                ctx.db.serviceOrder.count({
                    where: {
                        ...baseWhere,
                        status: { in: ['EM_VISTORIA', 'EM_EXECUCAO'] },
                    },
                }),
                ctx.db.payment.aggregate({
                    where: {
                        order: { tenantId: ctx.tenantId! },
                        paidAt: { gte: from, lte: to },
                    },
                    _sum: { amount: true },
                }),
                ctx.db.serviceOrder.count({
                    where: {
                        ...baseWhere,
                        status: 'AGUARDANDO_PAGAMENTO',
                    },
                }),
                ctx.db.customer.count({
                    where: { tenantId: ctx.tenantId! },
                }),
                ctx.db.serviceOrder.findMany({
                    where: baseWhere,
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
                }),
                ctx.db.serviceOrder.findMany({
                    where: {
                        ...baseWhere,
                        status: 'AGENDADO',
                        scheduledAt: { gte: today, lte: todayEnd },
                    },
                    take: 10,
                    orderBy: { scheduledAt: 'asc' },
                    select: {
                        id: true,
                        scheduledAt: true,
                        vehicle: {
                            select: {
                                brand: true,
                                model: true,
                                customer: { select: { name: true } },
                            },
                        },
                        items: {
                            select: { id: true },
                        },
                    },
                }),
                ctx.db.tenant.findUnique({
                    where: { id: ctx.tenantId! },
                    select: { slug: true },
                }),
            ]);

            return {
                stats: {
                    todayOrders: todayOrdersCount,
                    inProgress: inProgressCount,
                    monthRevenue: Number(periodRevenue._sum.amount) || 0,
                    pendingPayments: pendingPaymentsCount,
                },
                customerCount,
                recentOrders,
                todaySchedule,
                tenantSlug: tenant?.slug,
            };
        }),

    getFinancialChartData: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
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

        const dailyRevenue = new Map<string, number>();
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

    getTeamFinancials: managerProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
                commissions: {
                    where: {
                        calculatedAt: { gte: startOfMonth },
                    },
                    select: {
                        commissionValue: true,
                    },
                },
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
                roi: totalPayout > 0 ? (revenueGenerated / totalPayout) : 0,
            };
        });

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

    getFinancialOverview: managerProcedure
        .input(z.object({
            from: z.date().optional(),
            to: z.date().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            const now = new Date();
            const from = input?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
            const to = input?.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const [
                periodPayments,
                periodOrders,
                ordersWithBalance,
                payments,
                users,
                detailedPayments,
                detailedCommissions,
                openOrdersCount,
                detailedCompletedOrders,
                detailedOpenOrders
            ] = await Promise.all([
                ctx.db.payment.aggregate({
                    where: {
                        order: { tenantId: ctx.tenantId! },
                        paidAt: { gte: from, lte: to },
                    },
                    _sum: { amount: true },
                    _count: true,
                }),
                ctx.db.serviceOrder.count({
                    where: {
                        tenantId: ctx.tenantId!,
                        status: 'CONCLUIDO',
                        completedAt: { gte: from, lte: to },
                    },
                }),
                ctx.db.serviceOrder.findMany({
                    where: {
                        tenantId: ctx.tenantId!,
                        status: { notIn: ['CANCELADO'] },
                        // Receivables are global, not trapped in period usually, 
                        // but we can filter by creation or just show global pending
                    },
                    select: {
                        total: true,
                        payments: { select: { amount: true } },
                    },
                }),
                ctx.db.payment.findMany({
                    where: {
                        order: { tenantId: ctx.tenantId! },
                        paidAt: { gte: from, lte: to },
                    },
                    select: { paidAt: true, amount: true },
                    orderBy: { paidAt: 'asc' },
                }),
                ctx.db.user.findMany({
                    where: { tenantId: ctx.tenantId!, isActive: true },
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        jobTitle: true,
                        salary: true,
                        avatarUrl: true,
                        commissions: {
                            where: { calculatedAt: { gte: from, lte: to } },
                            select: { commissionValue: true },
                        },
                        assignedOrders: {
                            where: { status: 'CONCLUIDO', completedAt: { gte: from, lte: to } },
                            select: { total: true },
                        },
                    },
                }),
                // Detailed Payments for Export
                ctx.db.payment.findMany({
                    where: {
                        order: { tenantId: ctx.tenantId! },
                        paidAt: { gte: from, lte: to },
                    },
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        paidAt: true,
                        receivedBy: true,
                        order: {
                            select: {
                                code: true,
                                vehicle: {
                                    select: {
                                        customer: { select: { name: true } }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { paidAt: 'desc' }
                }),
                // Detailed Commissions for Export
                ctx.db.orderItemCommission.findMany({
                    where: {
                        orderItem: {
                            order: {
                                tenantId: ctx.tenantId!,
                                completedAt: { gte: from, lte: to }
                            }
                        }
                    },
                    select: {
                        id: true,
                        commissionValue: true,
                        calculatedAt: true,
                        user: { select: { name: true } },
                        orderItem: {
                            select: {
                                service: { select: { name: true } },
                                customName: true,
                                order: { select: { code: true } }
                            }
                        }
                    },
                    orderBy: { calculatedAt: 'desc' }
                }),
                // Open Orders Count
                ctx.db.serviceOrder.count({
                    where: {
                        tenantId: ctx.tenantId!,
                        status: { notIn: ['CONCLUIDO', 'CANCELADO'] }
                    }
                }),
                // Detailed Completed Orders for Export
                ctx.db.serviceOrder.findMany({
                    where: {
                        tenantId: ctx.tenantId!,
                        status: 'CONCLUIDO',
                        completedAt: { gte: from, lte: to }
                    },
                    select: {
                        code: true,
                        total: true,
                        completedAt: true,
                        vehicle: {
                            select: {
                                customer: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: { completedAt: 'desc' }
                }),
                // Detailed Open Orders for Export
                ctx.db.serviceOrder.findMany({
                    where: {
                        tenantId: ctx.tenantId!,
                        status: { notIn: ['CONCLUIDO', 'CANCELADO'] }
                    },
                    select: {
                        code: true,
                        total: true,
                        status: true,
                        scheduledAt: true,
                        vehicle: {
                            select: {
                                customer: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: { scheduledAt: 'asc' }
                }),
            ]);

            let receivables = 0;
            for (const order of ordersWithBalance) {
                const orderTotal = Number(order.total);
                const orderPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const balance = orderTotal - orderPaid;
                if (balance > 0.01) receivables += balance;
            }

            const revenue = Number(periodPayments._sum.amount) || 0;
            const avgTicket = periodOrders > 0 ? revenue / periodOrders : 0;

            const dailyRevenue = new Map<string, number>();
            // Initialize all days in selected range
            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                dailyRevenue.set(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 0);
            }
            for (const p of payments) {
                const dayStr = p.paidAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                dailyRevenue.set(dayStr, (dailyRevenue.get(dayStr) || 0) + Number(p.amount));
            }
            const chartData = Array.from(dailyRevenue.entries()).map(([date, rev]) => ({ date, revenue: rev }));

            const teamStats = users.map(user => {
                const fixedSalary = Number(user.salary) || 0;
                const commissions = user.commissions.reduce((sum, c) => sum + Number(c.commissionValue), 0);
                const revenueGenerated = user.assignedOrders.reduce((sum, o) => sum + Number(o.total), 0);
                return {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    jobTitle: user.jobTitle || 'N/A',
                    avatarUrl: user.avatarUrl,
                    fixedSalary,
                    commissions,
                    totalPayout: fixedSalary + commissions,
                    revenueGenerated,
                    ordersCount: user.assignedOrders.length,
                    roi: (fixedSalary + commissions) > 0 ? revenueGenerated / (fixedSalary + commissions) : 0,
                };
            });

            return {
                stats: { revenue, avgTicket, receivables, paymentCount: periodPayments._count, completedOrders: periodOrders },
                chartData,
                team: {
                    users: teamStats,
                    totalPayroll: teamStats.reduce((sum, u) => sum + u.totalPayout, 0),
                    totalFixed: teamStats.reduce((sum, u) => sum + u.fixedSalary, 0),
                    totalCommissions: teamStats.reduce((sum, u) => sum + u.commissions, 0),
                },
                detailedPayments,
                detailedCommissions,
                detailedCompletedOrders,
                detailedOpenOrders,
                openOrdersCount,
            };
        }),
});
