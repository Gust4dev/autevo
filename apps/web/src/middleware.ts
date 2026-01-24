import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/activate(.*)',
    '/payment-success(.*)',
    '/public/(.*)',
    '/tracking(.*)',
    '/booking(.*)',
    '/api/cron/(.*)',
    '/api/webhooks/(.*)',
    '/api/debug/(.*)',
    '/api/trpc/(.*)',
]);

const isOnboardingRoute = createRouteMatcher([
    '/welcome(.*)',
    '/awaiting-invite(.*)',
    '/setup(.*)',
    '/onboarding/(.*)',
]);

const isActivateRoute = createRouteMatcher(['/activate(.*)']);
const isTrialExpiredRoute = createRouteMatcher(['/trial-expired(.*)']);
const isPaymentRoute = createRouteMatcher(['/onboarding/payment(.*)']);

export default clerkMiddleware(async (auth, request) => {
    // Redirect authenticated users from landing to dashboard
    if (request.nextUrl.pathname === '/') {
        const session = await auth();
        if (session.userId) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return;
    }

    if (!isPublicRoute(request)) {
        await auth.protect();

        const session = await auth();
        const metadata = session.sessionClaims?.public_metadata as {
            needsOnboarding?: boolean;
            tenantStatus?: string;
            trialEndsAt?: string;
            isFoundingMember?: boolean;
        } | undefined;

        const tenantStatus = metadata?.tenantStatus;
        const currentPath = request.nextUrl.pathname;

        // BILLING: Handle CANCELED and INCOMPLETE - block access except trial-expired and payment
        if (tenantStatus === 'CANCELED' || tenantStatus === 'INCOMPLETE') {
            if (!isTrialExpiredRoute(request) && !isPaymentRoute(request)) {
                return NextResponse.redirect(new URL('/trial-expired', request.url));
            }
        }

        // BILLING: Handle PAST_DUE - allow access with grace period (7 days)
        // The trial-expired page will show appropriate messaging
        if (tenantStatus === 'PAST_DUE') {
            // Allow access for now, but could add 7-day check here if needed
            // The dashboard can show a warning banner
        }

        // Check for expired trial (14 days logic for non-founding members)
        if (tenantStatus === 'TRIAL') {
            const trialEndsAt = metadata?.trialEndsAt;
            const isFoundingMember = metadata?.isFoundingMember;

            if (!isFoundingMember && trialEndsAt && new Date(trialEndsAt) < new Date()) {
                if (!isTrialExpiredRoute(request) && !isPaymentRoute(request)) {
                    return NextResponse.redirect(new URL('/trial-expired', request.url));
                }
            }
        }

        // Redirect suspended users to /trial-expired
        if (tenantStatus === 'SUSPENDED') {
            if (!isTrialExpiredRoute(request)) {
                return NextResponse.redirect(new URL('/trial-expired', request.url));
            }
        }

        // Redirect pending activation users to /activate page
        if (tenantStatus === 'PENDING_ACTIVATION' && !isActivateRoute(request)) {
            return NextResponse.redirect(new URL('/activate', request.url));
        }

        // Redirect users needing onboarding to /welcome
        if (metadata?.needsOnboarding && !isOnboardingRoute(request)) {
            return NextResponse.redirect(new URL('/welcome', request.url));
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};
