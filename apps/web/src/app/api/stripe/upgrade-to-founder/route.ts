import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { stripe, STRIPE_PRICES, mapStripeStatus } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * Upgrade subscription from Standard to Founder plan.
 * Checks if founder slots are available before processing.
 */
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user and tenant
        const user = await prisma.user.findFirst({
            where: { clerkId: session.userId },
            include: { tenant: true },
        });

        if (!user?.tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Check if user already has subscription
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId: user.tenantId },
        });

        if (!subscription) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        // Check if already a founder
        if (subscription.isFounder) {
            return NextResponse.json({ error: 'Already a Founding Member' }, { status: 400 });
        }

        // Check founder slots availability
        const usedSlots = await prisma.tenant.count({
            where: { isFoundingMember: true },
        });
        const maxSlots = 15;

        if (usedSlots >= maxSlots) {
            return NextResponse.json({ error: 'No Founding Member slots available' }, { status: 400 });
        }

        // Get the Stripe subscription
        if (!subscription.stripeSubscriptionId) {
            return NextResponse.json({ error: 'No Stripe subscription found' }, { status: 400 });
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

        // Update the subscription to founder price
        const founderPriceId = STRIPE_PRICES.FOUNDER;
        if (!founderPriceId) {
            return NextResponse.json({ error: 'Founder price not configured' }, { status: 500 });
        }

        // Update subscription item to new price
        const updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [{
                id: stripeSubscription.items.data[0].id,
                price: founderPriceId,
            }],
            proration_behavior: 'create_prorations', // Bill the difference
            metadata: {
                ...stripeSubscription.metadata,
                isFounder: 'true',
                upgradedAt: new Date().toISOString(),
            },
        });

        // Update subscription in database
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                isFounder: true,
                founderExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                stripePriceId: founderPriceId,
            },
        });

        // Update tenant
        await prisma.tenant.update({
            where: { id: user.tenantId },
            data: { isFoundingMember: true },
        });

        return NextResponse.json({
            success: true,
            message: 'Upgraded to Founding Member successfully',
        });
    } catch (error) {
        console.error('[Upgrade to Founder Error]', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
