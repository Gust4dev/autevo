import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const MONTHLY_PRICE = 140;
const COMMISSION_PERCENT = 30;
const COMMISSION_AMOUNT = (MONTHLY_PRICE * COMMISSION_PERCENT) / 100; // R$ 42
const FREE_TIER_THRESHOLD = 5; // 5+ clientes = mensalidade grátis

export const partnershipRouter = router({
    /**
     * Retorna estatísticas gerais do parceiro
     */
    getPartnerStats: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.tenantId) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const tenant = await ctx.db.tenant.findUnique({
            where: { id: ctx.tenantId },
            select: {
                partnerCode: true,
                name: true,
            },
        });

        // Buscar referrals ativos (que já geraram pelo menos uma comissão)
        const referrals = await ctx.db.partnerReferral.findMany({
            where: { partnerTenantId: ctx.tenantId },
            include: {
                referredTenant: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        subscription: {
                            select: { status: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const activeReferrals = referrals.filter(
            (r) => r.status === 'ACTIVE'
        );
        const pendingReferrals = referrals.filter(
            (r) => r.status === 'PENDING'
        );

        // Calcular receita mensal estimada (só de ativos que já passaram do 1º mês)
        const now = new Date();
        const eligibleForCommission = activeReferrals.filter(
            (r) => r.commissionStartsAt && r.commissionStartsAt <= now
        );

        const monthlyRevenue = eligibleForCommission.length * COMMISSION_AMOUNT;
        const annualRevenue = monthlyRevenue * 12;

        // Verificar se tem mensalidade grátis
        const hasFreeTier = eligibleForCommission.length >= FREE_TIER_THRESHOLD;
        const annualSavings = hasFreeTier ? MONTHLY_PRICE * 12 : 0;

        // Buscar comissões pendentes
        const pendingCommissions = await ctx.db.partnerCommission.aggregate({
            where: {
                tenantId: ctx.tenantId,
                status: 'PENDING',
            },
            _sum: { amount: true },
            _count: true,
        });

        return {
            partnerCode: tenant?.partnerCode || null,
            tenantName: tenant?.name || '',
            totalReferrals: referrals.length,
            activeReferrals: activeReferrals.length,
            pendingReferrals: pendingReferrals.length,
            eligibleForCommission: eligibleForCommission.length,
            monthlyRevenue,
            annualRevenue,
            hasFreeTier,
            annualSavings,
            commissionPercent: COMMISSION_PERCENT,
            commissionAmount: COMMISSION_AMOUNT,
            freeTierThreshold: FREE_TIER_THRESHOLD,
            pendingCommissionAmount: Number(pendingCommissions._sum.amount || 0),
            pendingCommissionCount: pendingCommissions._count,
        };
    }),

    /**
     * Retorna lista de tenants indicados
     */
    getReferredTenants: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.tenantId) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const referrals = await ctx.db.partnerReferral.findMany({
            where: { partnerTenantId: ctx.tenantId },
            include: {
                referredTenant: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        subscription: {
                            select: { status: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();

        return referrals.map((r) => ({
            id: r.id,
            tenantId: r.referredTenantId,
            tenantName: r.referredTenant.name,
            status: r.status,
            subscriptionStatus: r.referredTenant.subscription?.status || null,
            createdAt: r.createdAt,
            firstPaymentAt: r.firstPaymentAt,
            commissionStartsAt: r.commissionStartsAt,
            isEligibleForCommission:
                r.status === 'ACTIVE' &&
                r.commissionStartsAt !== null &&
                r.commissionStartsAt <= now,
            estimatedMonthlyCommission:
                r.status === 'ACTIVE' &&
                    r.commissionStartsAt !== null &&
                    r.commissionStartsAt <= now
                    ? COMMISSION_AMOUNT
                    : 0,
        }));
    }),

    /**
     * Retorna histórico de comissões
     */
    getCommissionHistory: protectedProcedure
        .input(
            z.object({
                limit: z.number().optional().default(20),
                cursor: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.tenantId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const commissions = await ctx.db.partnerCommission.findMany({
                where: { tenantId: ctx.tenantId },
                include: {
                    referral: {
                        include: {
                            referredTenant: {
                                select: { name: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: input.limit + 1,
                cursor: input.cursor ? { id: input.cursor } : undefined,
            });

            let nextCursor: string | undefined;
            if (commissions.length > input.limit) {
                const nextItem = commissions.pop();
                nextCursor = nextItem?.id;
            }

            return {
                items: commissions.map((c) => ({
                    id: c.id,
                    amount: Number(c.amount),
                    periodStart: c.periodStart,
                    periodEnd: c.periodEnd,
                    status: c.status,
                    paidAt: c.paidAt,
                    pixTransactionId: c.pixTransactionId,
                    referredTenantName: c.referral.referredTenant.name,
                    createdAt: c.createdAt,
                })),
                nextCursor,
            };
        }),

    /**
     * Gera ou atualiza código de parceiro
     */
    generatePartnerCode: protectedProcedure
        .input(
            z.object({
                code: z
                    .string()
                    .min(3)
                    .max(20)
                    .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.tenantId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            // Verificar se código já existe
            const existing = await ctx.db.tenant.findFirst({
                where: {
                    partnerCode: input.code,
                    NOT: { id: ctx.tenantId },
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Este código já está em uso por outra empresa',
                });
            }

            // Atualizar código
            await ctx.db.tenant.update({
                where: { id: ctx.tenantId },
                data: { partnerCode: input.code },
            });

            return { code: input.code };
        }),

    /**
     * Valida código de parceiro (para uso no checkout/signup)
     */
    validatePartnerCode: protectedProcedure
        .input(z.object({ code: z.string() }))
        .query(async ({ ctx, input }) => {
            const tenant = await ctx.db.tenant.findFirst({
                where: {
                    partnerCode: input.code.toUpperCase(),
                },
                select: {
                    id: true,
                    name: true,
                    partnerCode: true,
                },
            });

            if (!tenant) {
                return { valid: false, tenantName: null };
            }

            // Não pode usar próprio código
            if (tenant.id === ctx.tenantId) {
                return { valid: false, tenantName: null, error: 'Você não pode usar seu próprio código' };
            }

            return {
                valid: true,
                tenantName: tenant.name,
                partnerCode: tenant.partnerCode,
            };
        }),

    /**
     * Sugestão de código baseado no nome da empresa
     */
    suggestPartnerCode: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.tenantId) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const tenant = await ctx.db.tenant.findUnique({
            where: { id: ctx.tenantId },
            select: { name: true, partnerCode: true },
        });

        if (!tenant) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }

        // Se já tem código, retornar
        if (tenant.partnerCode) {
            return { suggestion: tenant.partnerCode, hasCode: true };
        }

        // Gerar sugestão baseada no nome
        const baseName = tenant.name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 12);

        // Verificar se sugestão está disponível
        const existing = await ctx.db.tenant.findFirst({
            where: { partnerCode: baseName },
        });

        if (!existing) {
            return { suggestion: baseName, hasCode: false };
        }

        // Adicionar número aleatório
        const randomSuffix = Math.floor(Math.random() * 100)
            .toString()
            .padStart(2, '0');
        return { suggestion: `${baseName.substring(0, 10)}${randomSuffix}`, hasCode: false };
    }),
});

export type PartnershipRouter = typeof partnershipRouter;
