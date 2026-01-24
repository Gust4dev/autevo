import { NextResponse } from 'next/server';
import { prisma } from '@autevo/database';
import { stripe } from '@/lib/stripe';

// This endpoint should be called daily by a cron job (e.g., Vercel Cron)
// Protected by CRON_SECRET in production
export async function GET(request: Request) {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();

        // Find all founder subscriptions that have expired
        const expiredFounders = await prisma.subscription.findMany({
            where: {
                isFounder: true,
                founderExpiresAt: { lte: now },
                status: 'ACTIVE',
            },
            include: {
                tenant: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        const results = {
            processed: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const subscription of expiredFounders) {
            try {
                // Update Stripe subscription to standard price
                if (subscription.stripeSubscriptionId) {
                    const stripeSubscription = await stripe.subscriptions.retrieve(
                        subscription.stripeSubscriptionId
                    );

                    const standardPriceId = process.env.STRIPE_PRICE_ID_STANDARD;

                    if (standardPriceId && stripeSubscription.items.data[0]) {
                        // Update the subscription item to the new price
                        await stripe.subscriptionItems.update(
                            stripeSubscription.items.data[0].id,
                            {
                                price: standardPriceId,
                                proration_behavior: 'none', // No proration, new price starts next billing
                            }
                        );
                    }
                }

                // Update database
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        isFounder: false,
                        stripePriceId: process.env.STRIPE_PRICE_ID_STANDARD || subscription.stripePriceId,
                    },
                });

                // Update tenant founding member status
                await prisma.tenant.update({
                    where: { id: subscription.tenantId },
                    data: { isFoundingMember: false },
                });

                results.processed++;
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }

        return NextResponse.json({
            success: true,
            ...results,
            message: `Processed ${results.processed} founder transitions, ${results.failed} failed`,
        });
    } catch (error) {
        console.error('[Cron] Founder subscription update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
