import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { stripe, mapStripeStatus } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Fallback endpoint to sync subscription from Stripe when webhooks are not available.
 * This is especially useful for local development where Stripe CLI is not configured.
 * 
 * Called by the payment-success page after checkout completes.
 */
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        // Get the checkout session from Stripe
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

        if (checkoutSession.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        const tenantId = checkoutSession.metadata?.tenantId;
        const isFounder = checkoutSession.metadata?.isFounder === 'true';
        const promoCodeId = checkoutSession.metadata?.promoCodeId || null;

        if (!tenantId) {
            return NextResponse.json({ error: 'Missing tenantId in session' }, { status: 400 });
        }

        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;

        if (!subscriptionId) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
        }

        // Fetch the full subscription object to get all properties
        const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Check if subscription already exists (webhook may have processed it)
        const existingSubscription = await prisma.subscription.findUnique({
            where: { tenantId },
        });

        if (existingSubscription && existingSubscription.status === 'ACTIVE') {
            return NextResponse.json({
                success: true,
                message: 'Subscription already synced',
                subscription: existingSubscription,
            });
        }

        // Calculate promo discount months
        let promoMonthsRemaining = 0;
        if (promoCodeId) {
            const promoCode = await prisma.promoCode.findUnique({
                where: { id: promoCodeId },
            });
            if (promoCode) {
                const isYearly = stripeSubscription.items?.data[0]?.price?.recurring?.interval === 'year';
                promoMonthsRemaining = isYearly ? promoCode.yearlyDuration : promoCode.monthlyDuration;
            }
        }

        // Get period dates - these exist on the subscription object at runtime
        const subscriptionData = stripeSubscription as unknown as {
            current_period_start: number;
            current_period_end: number;
        };
        const currentPeriodStart = subscriptionData.current_period_start
            ? new Date(subscriptionData.current_period_start * 1000)
            : new Date();
        const currentPeriodEnd = subscriptionData.current_period_end
            ? new Date(subscriptionData.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

        // Create or update subscription
        const subscription = await prisma.subscription.upsert({
            where: { tenantId },
            create: {
                tenantId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: stripeSubscription.items?.data[0]?.price?.id,
                status: mapStripeStatus(stripeSubscription.status),
                billingInterval: stripeSubscription.items?.data[0]?.price?.recurring?.interval === 'year' ? 'YEARLY' : 'MONTHLY',
                currentPeriodStart,
                currentPeriodEnd,
                isFounder,
                founderExpiresAt: isFounder ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : null,
                promoCodeId,
                promoDiscountApplied: !!promoCodeId,
                promoMonthsRemaining,
            },
            update: {
                stripeCustomerId: customerId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: stripeSubscription.items?.data[0]?.price?.id,
                status: mapStripeStatus(stripeSubscription.status),
                currentPeriodStart,
                currentPeriodEnd,
                isFounder: existingSubscription?.isFounder || isFounder,
                founderExpiresAt: isFounder ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : existingSubscription?.founderExpiresAt,
            },
        });

        // Update tenant status
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                status: 'ACTIVE',
                stripeCustomerId: customerId,
                isFoundingMember: isFounder,
            },
        });

        // Increment founder slots if applicable and not already counted
        if (isFounder && !existingSubscription?.isFounder) {
            await prisma.founderSlot.updateMany({
                data: { usedSlots: { increment: 1 } },
            });
        }

        // Update Clerk metadata
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { users: { where: { role: 'OWNER' } } },
        });

        if (tenant?.users[0]?.clerkId) {
            const clerk = await clerkClient();
            await clerk.users.updateUser(tenant.users[0].clerkId, {
                publicMetadata: {
                    tenantId,
                    role: 'OWNER',
                    dbUserId: tenant.users[0].id,
                    tenantStatus: 'ACTIVE',
                    isFoundingMember: isFounder,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription synced successfully',
            subscription,
        });
    } catch (error) {
        console.error('[Sync Subscription Error]', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
