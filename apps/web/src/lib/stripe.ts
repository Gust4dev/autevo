import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
});

// Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
    STANDARD_MONTHLY: process.env.STRIPE_PRICE_ID_STANDARD || '',
    FOUNDER: process.env.STRIPE_PRICE_ID_FOUNDER || '',
} as const;

// Stripe Webhook Event Types we handle
export const STRIPE_WEBHOOK_EVENTS = {
    CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
    CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
    CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END: 'customer.subscription.trial_will_end',
} as const;

// Map Stripe subscription status to our enum
export function mapStripeStatus(stripeStatus: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' {
    switch (stripeStatus) {
        case 'active':
            return 'ACTIVE';
        case 'past_due':
            return 'PAST_DUE';
        case 'canceled':
            return 'CANCELED';
        case 'trialing':
            return 'TRIALING';
        case 'incomplete':
        case 'incomplete_expired':
        case 'unpaid':
        default:
            return 'INCOMPLETE';
    }
}
