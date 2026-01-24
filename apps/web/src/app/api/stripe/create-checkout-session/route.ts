import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

interface CheckoutRequestBody {
    promoCode?: string;
    billingInterval?: 'monthly' | 'yearly';
    successUrl?: string;
    cancelUrl?: string;
    isFounder?: boolean;
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get tenantId from JWT claims first, fallback to DB lookup
        let tenantId = (session.sessionClaims?.public_metadata as { tenantId?: string })?.tenantId;

        // Fallback: find user by clerkId to get tenantId
        if (!tenantId) {
            const userByClerk = await prisma.user.findFirst({
                where: { clerkId: session.userId },
                select: { tenantId: true },
            });
            tenantId = userByClerk?.tenantId ?? undefined;
        }

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant not found. Please complete onboarding first.' }, { status: 400 });
        }

        const body: CheckoutRequestBody = await request.json().catch(() => ({}));
        const { promoCode, billingInterval = 'monthly', successUrl, cancelUrl, isFounder = false } = body;

        // Get tenant info
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Get user
        const user = await prisma.user.findFirst({
            where: {
                tenantId,
                clerkId: session.userId,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Validate promo code if provided
        let promoCodeRecord = null;
        if (promoCode) {
            promoCodeRecord = await prisma.promoCode.findFirst({
                where: {
                    code: promoCode.toUpperCase(),
                    isActive: true,
                    AND: [
                        {
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } },
                            ],
                        },
                    ],
                },
            });

            // Check if max uses exceeded
            if (promoCodeRecord && promoCodeRecord.maxUses !== null && promoCodeRecord.usedCount >= promoCodeRecord.maxUses) {
                promoCodeRecord = null;
            }

            if (!promoCodeRecord) {
                return NextResponse.json({ error: 'Código promocional inválido ou expirado' }, { status: 400 });
            }
        }

        // Calculate discount
        let couponId: string | undefined;
        if (promoCodeRecord) {
            // Create or get Stripe coupon
            const couponName = `PROMO_${promoCodeRecord.code}`;

            try {
                const existingCoupons = await stripe.coupons.list({ limit: 100 });
                const existingCoupon = existingCoupons.data.find((c: { name: string | null }) => c.name === couponName);

                if (existingCoupon) {
                    couponId = existingCoupon.id;
                } else {
                    const duration = billingInterval === 'yearly'
                        ? promoCodeRecord.yearlyDuration
                        : promoCodeRecord.monthlyDuration;

                    const newCoupon = await stripe.coupons.create({
                        name: couponName,
                        percent_off: promoCodeRecord.discountPercent,
                        duration: 'repeating',
                        duration_in_months: duration,
                        currency: 'brl',
                    });
                    couponId = newCoupon.id;
                }
            } catch (e) {
                console.error('[Checkout] Coupon error:', e);
            }
        }

        // Use existing Stripe customer or create new one
        let customerId = tenant.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: tenant.name,
                metadata: {
                    tenantId,
                    userId: user.id,
                },
            });
            customerId = customer.id;

            // Save Stripe customer ID
            await prisma.tenant.update({
                where: { id: tenantId },
                data: { stripeCustomerId: customerId },
            });
        }

        // Get price ID based on founder status
        const priceId = isFounder ? STRIPE_PRICES.FOUNDER : STRIPE_PRICES.STANDARD_MONTHLY;

        if (!priceId) {
            return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
        }

        // Create checkout session
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            discounts: couponId ? [{ coupon: couponId }] : undefined,
            metadata: {
                tenantId,
                userId: user.id,
                promoCodeId: promoCodeRecord?.id || '',
                isFounder: isFounder ? 'true' : 'false',
            },
            success_url: successUrl || `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&founder=${isFounder}`,
            cancel_url: cancelUrl || `${origin}/activate?canceled=true`,
            allow_promotion_codes: false, // We handle our own promo codes
            billing_address_collection: 'required',
            locale: 'pt-BR',
        });

        return NextResponse.json({
            url: checkoutSession.url,
            sessionId: checkoutSession.id,
        });
    } catch (error) {
        console.error('[Checkout Session Error]', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
