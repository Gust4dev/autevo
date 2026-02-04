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
            role?: string;
        } | undefined;

        const tenantStatus = metadata?.tenantStatus;

        if (tenantStatus === 'CANCELED' || tenantStatus === 'INCOMPLETE') {
            if (!isTrialExpiredRoute(request) && !isPaymentRoute(request)) {
                return NextResponse.redirect(new URL('/trial-expired', request.url));
            }
        }

        if (tenantStatus === 'TRIAL') {
            const trialEndsAt = metadata?.trialEndsAt;
            const isFoundingMember = metadata?.isFoundingMember;

            if (!isFoundingMember && trialEndsAt && new Date(trialEndsAt) < new Date()) {
                if (!isTrialExpiredRoute(request) && !isPaymentRoute(request)) {
                    return NextResponse.redirect(new URL('/trial-expired', request.url));
                }
            }
        }

        if (tenantStatus === 'SUSPENDED') {
            if (!isTrialExpiredRoute(request)) {
                return NextResponse.redirect(new URL('/trial-expired', request.url));
            }
        }

        if (tenantStatus === 'PENDING_ACTIVATION' && !isActivateRoute(request) && request.nextUrl.pathname !== '/setup') {
            return NextResponse.redirect(new URL('/activate', request.url));
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
