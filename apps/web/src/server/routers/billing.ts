import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import type { SubscriptionPayment, PromoCode, Subscription } from '@autevo/database';

export const billingRouter = router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.tenantId) return null;

        const [subscription, tenant] = await Promise.all([
            ctx.db.subscription.findUnique({
                where: { tenantId: ctx.tenantId },
                include: {
                    promoCode: {
                        select: {
                            code: true,
                            discountPercent: true,
                        },
                    },
                },
            }),
            ctx.db.tenant.findUnique({
                where: { id: ctx.tenantId },
                select: {
                    status: true,
                    trialEndsAt: true,
                    trialStartedAt: true,
                    isFoundingMember: true,
                },
            }),
        ]);

        return {
            id: subscription?.id ?? null,
            status: subscription?.status ?? null,
            billingInterval: subscription?.billingInterval ?? null,
            currentPeriodStart: subscription?.currentPeriodStart ?? null,
            currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
            customMonthlyPrice: subscription?.customMonthlyPrice ? Number(subscription.customMonthlyPrice) : null,
            isFounder: subscription?.isFounder ?? tenant?.isFoundingMember ?? false,
            founderExpiresAt: subscription?.founderExpiresAt ?? null,
            promoDiscountApplied: subscription?.promoDiscountApplied ?? false,
            promoMonthsRemaining: subscription?.promoMonthsRemaining ?? 0,
            promoCode: subscription?.promoCode ?? null,
            tenantStatus: tenant?.status ?? null,
            trialEndsAt: tenant?.trialEndsAt ?? null,
            trialStartedAt: tenant?.trialStartedAt ?? null,
        };
    }),

    getPayments: protectedProcedure
        .input(z.object({ limit: z.number().optional().default(10) }))
        .query(async ({ ctx, input }) => {
            if (!ctx.tenantId) return [];

            const subscription = await ctx.db.subscription.findUnique({
                where: { tenantId: ctx.tenantId },
                select: { id: true },
            });

            if (!subscription) {
                return [];
            }

            const payments = await ctx.db.subscriptionPayment.findMany({
                where: { subscriptionId: subscription.id },
                orderBy: { createdAt: 'desc' },
                take: input.limit,
            });

            return payments.map((p: SubscriptionPayment) => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                paidAt: p.paidAt,
                createdAt: p.createdAt,
            }));
        }),

    getPromoCodeStats: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.tenantId) return [];

        const promoCodes = await ctx.db.promoCode.findMany({
            where: { referrerTenantId: ctx.tenantId },
            include: {
                _count: {
                    select: { usages: true },
                },
            },
        });

        return promoCodes.map((pc: PromoCode & { _count: { usages: number } }) => ({
            id: pc.id,
            code: pc.code,
            discountPercent: pc.discountPercent,
            usedCount: pc.usedCount,
            maxUses: pc.maxUses,
            isActive: pc.isActive,
            expiresAt: pc.expiresAt,
            usagesCount: pc._count.usages,
        }));
    }),

    getCancellationStats: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.tenantId) return { orders: 0, customers: 0, photos: 0, vehicles: 0 };

        try {
            const [orders, customers, vehicles, itemPhotos, damagePhotos] = await Promise.all([
                ctx.db.serviceOrder.count({ where: { tenantId: ctx.tenantId } }),
                ctx.db.customer.count({ where: { tenantId: ctx.tenantId } }),
                ctx.db.vehicle.count({ where: { customer: { tenantId: ctx.tenantId } } }),
                ctx.db.inspectionItem.count({
                    where: {
                        inspection: { order: { tenantId: ctx.tenantId } },
                        photoUrl: { not: null }
                    }
                }),
                ctx.db.inspectionDamage.count({
                    where: {
                        inspection: { order: { tenantId: ctx.tenantId } },
                        photoUrl: { not: null }
                    }
                })
            ]);

            const photos = itemPhotos + damagePhotos;

            return { orders, customers, photos, vehicles };
        } catch (error) {
            console.error('[getCancellationStats] Error:', error);
            return { orders: 0, customers: 0, photos: 0, vehicles: 0 };
        }
    }),
});

export type BillingRouter = typeof billingRouter;
