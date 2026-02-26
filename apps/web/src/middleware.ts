import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const CURRENT_TOS_VERSION = 'v1.0';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/post-signup(.*)',
    '/activate(.*)',
    '/payment-success(.*)',
    '/public/(.*)',
    '/tracking(.*)',
    '/booking(.*)',
    '/terms',
    '/privacy',
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
    const pathname = request.nextUrl.pathname;

    // Authenticated users stuck on /sign-in → redirect to dashboard
    if (pathname.startsWith('/sign-in')) {
        const session = await auth();
        if (session.userId) {
            const redirectTo = request.nextUrl.searchParams.get('redirect_url') || '/dashboard';
            try {
                const target = new URL(redirectTo, request.url);
                // Only allow same-origin redirects
                if (target.origin === request.nextUrl.origin) {
                    return NextResponse.redirect(target);
                }
            } catch {
                // Invalid URL — fall back to dashboard
            }
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return;
    }

    if (pathname === '/') {
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
            tosVersion?: string;
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

        // ToS version re-acceptance: OWNER must re-accept if version is outdated
        if (
            metadata?.role === 'OWNER' &&
            metadata?.tosVersion &&
            metadata.tosVersion !== CURRENT_TOS_VERSION &&
            !isOnboardingRoute(request) &&
            !pathname.startsWith('/terms') &&
            !pathname.startsWith('/privacy')
        ) {
            return NextResponse.redirect(new URL('/setup?reaccept=true', request.url));
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
