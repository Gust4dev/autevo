import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/activate(.*)',
    '/suspended(.*)',
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
]);

const isSuspendedRoute = createRouteMatcher(['/suspended(.*)']);
const isActivateRoute = createRouteMatcher(['/activate(.*)']);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();

        const session = await auth();
        const metadata = session.sessionClaims?.public_metadata as {
            needsOnboarding?: boolean;
            tenantStatus?: string;
        } | undefined;

        const tenantStatus = metadata?.tenantStatus;

        // Check for expired trial (14 days logic for non-founding members)
        if (tenantStatus === 'TRIAL') {
            const trialEndsAt = (metadata as any)?.trialEndsAt;
            const isFoundingMember = (metadata as any)?.isFoundingMember;

            if (!isFoundingMember && trialEndsAt && new Date(trialEndsAt) < new Date()) {
                // If trial is expired and they are NOT a founding member, redirect to trial-expired
                if (!request.nextUrl.pathname.startsWith('/trial-expired')) {
                    return NextResponse.redirect(new URL('/trial-expired', request.url));
                }
            }
        }

        // Redirect suspended users to /suspended page
        if (tenantStatus === 'SUSPENDED' && !isSuspendedRoute(request)) {
            return NextResponse.redirect(new URL('/suspended', request.url));
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
