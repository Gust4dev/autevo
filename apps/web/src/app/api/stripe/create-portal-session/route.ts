import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = (session.sessionClaims?.public_metadata as { tenantId?: string })?.tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
        }

        // Get subscription with Stripe customer ID
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
        });

        if (!subscription?.stripeCustomerId) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // Create portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${origin}/dashboard/settings/billing`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error('[Portal Session Error]', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
