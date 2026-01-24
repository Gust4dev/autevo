import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@autevo/database';
import { stripe, mapStripeStatus, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';

async function logWebhook(
    event: Stripe.Event,
    status: 'success' | 'failed',
    errorMessage?: string
) {
    try {
        await prisma.webhookLog.upsert({
            where: { externalId: event.id },
            create: {
                source: 'stripe',
                event: event.type,
                externalId: event.id,
                status,
                payload: event as any,
                errorMessage,
                processedAt: status === 'success' ? new Date() : null,
            },
            update: {
                status,
                errorMessage,
                processedAt: status === 'success' ? new Date() : null,
                attempts: { increment: 1 },
            },
        });
    } catch (e) {
        console.error('[Webhook Log Error]', e);
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    const promoCodeId = session.metadata?.promoCodeId;
    const isFounder = session.metadata?.isFounder === 'true';

    if (!tenantId) {
        throw new Error('Missing tenantId in session metadata');
    }

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Calculate promo discount months
    let promoMonthsRemaining = 0;
    if (promoCodeId) {
        const promoCode = await prisma.promoCode.findUnique({
            where: { id: promoCodeId },
        });
        if (promoCode) {
            const isYearly = stripeSubscription.items.data[0]?.price.recurring?.interval === 'year';
            promoMonthsRemaining = isYearly ? promoCode.yearlyDuration : promoCode.monthlyDuration;

            // Increment usage count
            await prisma.promoCode.update({
                where: { id: promoCodeId },
                data: { usedCount: { increment: 1 } },
            });

            // Record usage
            await prisma.promoCodeUsage.create({
                data: {
                    promoCodeId,
                    usedByTenantId: tenantId,
                    originalAmount: Number(session.amount_total || 0) / 100,
                    discountAmount: Number(session.total_details?.amount_discount || 0) / 100,
                },
            });
        }
    }

    // Create or update subscription
    const sub = stripeSubscription as any;
    await prisma.subscription.upsert({
        where: { tenantId },
        create: {
            tenantId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            status: mapStripeStatus(stripeSubscription.status),
            billingInterval: stripeSubscription.items.data[0]?.price.recurring?.interval === 'year' ? 'YEARLY' : 'MONTHLY',
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            isFounder,
            founderExpiresAt: isFounder ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : null,
            promoCodeId,
            promoDiscountApplied: !!promoCodeId,
            promoMonthsRemaining,
        },
        update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            status: mapStripeStatus(stripeSubscription.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
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

    // Increment founder slots if applicable
    if (isFounder) {
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
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) {
        console.warn(`[Webhook] Subscription not found: ${subscription.id}`);
        return;
    }

    const sub = subscription as any;
    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            status: mapStripeStatus(subscription.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });

    // Sync tenant status
    const tenantStatus = subscription.status === 'active' ? 'ACTIVE' :
        subscription.status === 'past_due' ? 'PAST_DUE' :
            subscription.status === 'canceled' ? 'CANCELED' : 'SUSPENDED';

    await prisma.tenant.update({
        where: { id: dbSubscription.tenantId },
        data: { status: tenantStatus },
    });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) {
        console.warn(`[Webhook] Subscription not found: ${subscription.id}`);
        return;
    }

    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'CANCELED' },
    });

    await prisma.tenant.update({
        where: { id: dbSubscription.tenantId },
        data: { status: 'CANCELED' },
    });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const inv = invoice as any;
    const subscriptionId = inv.subscription as string;

    const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
    });

    if (!dbSubscription) {
        console.warn(`[Webhook] Subscription not found for invoice: ${invoice.id}`);
        return;
    }

    // Create payment record
    await prisma.subscriptionPayment.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
            subscriptionId: dbSubscription.id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: inv.payment_intent as string | null,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            paidAt: new Date(),
        },
        update: {
            status: 'succeeded',
            paidAt: new Date(),
        },
    });

    // Decrement promo months if applicable
    if (dbSubscription.promoMonthsRemaining > 0) {
        await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: { promoMonthsRemaining: { decrement: 1 } },
        });
    }

    // Reset tenant status to ACTIVE if was PAST_DUE
    await prisma.tenant.update({
        where: { id: dbSubscription.tenantId },
        data: { status: 'ACTIVE' },
    });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const inv = invoice as any;
    const subscriptionId = inv.subscription as string;

    const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
    });

    if (!dbSubscription) {
        console.warn(`[Webhook] Subscription not found for invoice: ${invoice.id}`);
        return;
    }

    // Create failed payment record
    await prisma.subscriptionPayment.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
            subscriptionId: dbSubscription.id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: inv.payment_intent as string | null,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: 'failed',
        },
        update: {
            status: 'failed',
        },
    });

    // Update subscription and tenant to PAST_DUE
    await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: { status: 'PAST_DUE' },
    });

    await prisma.tenant.update({
        where: { id: dbSubscription.tenantId },
        data: { status: 'PAST_DUE' },
    });
}

export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Webhook] Signature verification failed:', message);
        return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case STRIPE_WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED:
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }

        await logWebhook(event, 'success');
        return NextResponse.json({ received: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Webhook] Handler error:', message);
        await logWebhook(event, 'failed', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
