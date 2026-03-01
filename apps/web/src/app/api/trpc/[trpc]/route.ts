import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import { appRouter } from '@/server/routers/_app';
import { prisma, type User } from '@autevo/database';
import { tenantExtension } from '@/lib/prisma-tenant';
import type { Context } from '@/server/trpc';
import { clerkClient } from '@clerk/nextjs/server';
import { getCachedUser, setCachedUser, isCacheValid } from '@/lib/user-cache';

async function createContext(req: Request): Promise<Context> {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || null;
    const userAgent = req.headers.get('user-agent') || null;
    const requestHeaders = { ipAddress, userAgent };

    try {
        const { userId, sessionClaims } = await auth();

        if (!userId) {
            return { db: prisma, user: null, tenantId: null, headers: requestHeaders };
        }

        if (isCacheValid(userId)) {
            const cached = getCachedUser(userId);
            if (cached) {
                const db = cached.user.tenantId ? prisma.$extends(tenantExtension(cached.user.tenantId)) : prisma;
                return { db, user: cached.user, tenantId: cached.user.tenantId, headers: requestHeaders };
            }
        }

        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { tenant: true },
        });

        // Sync Clerk metadata if out of date (fire-and-forget)
        if (user && sessionClaims) {
            const metadata = sessionClaims.public_metadata as { role?: string; tenantId?: string } | undefined;
            if (metadata?.role !== user.role || metadata?.tenantId !== user.tenantId) {
                clerkClient().then(client =>
                    client.users.updateUser(userId, {
                        publicMetadata: { tenantId: user!.tenantId, role: user!.role, dbUserId: user!.id }
                    })
                ).catch(() => { });
            }
        }

        // Auto-create user if not in DB
        if (!user) {
            try {
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(userId);
                const email = clerkUser.emailAddresses[0]?.emailAddress;
                const firstName = clerkUser.firstName || 'Usuário';

                if (email) {
                    // ── Case 1: Invited member (pre-created record, no clerkId yet) ──
                    const invitedUser = await prisma.user.findFirst({
                        where: { email, clerkId: null },
                        include: { tenant: true },
                    });

                    if (invitedUser) {
                        // Link the Clerk ID to the existing invited user record
                        user = await prisma.user.update({
                            where: { id: invitedUser.id },
                            data: {
                                clerkId: userId,
                                status: 'ACTIVE',
                                avatarUrl: clerkUser.imageUrl || invitedUser.avatarUrl,
                            },
                            include: { tenant: true },
                        });

                        // Sync Clerk metadata so middleware knows the correct tenant/role
                        client.users.updateUser(userId, {
                            publicMetadata: {
                                tenantId: user.tenantId,
                                role: user.role,
                                dbUserId: user.id,
                                tenantStatus: user.tenant?.status ?? 'ACTIVE',
                            }
                        }).catch(() => { });
                    } else {
                        // ── Case 2: Brand new owner sign-up ──
                        const tenantName = `Estética de ${firstName}`.trim();
                        const baseSlug = tenantName.toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');

                        // Ensure slug uniqueness with up to 3 retries
                        let slug = baseSlug;
                        let attempts = 0;
                        while (attempts < 3) {
                            const existing = await prisma.tenant.findUnique({
                                where: { slug },
                                select: { id: true },
                            });
                            if (!existing) break;
                            slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
                            attempts++;
                        }

                        user = await prisma.user.create({
                            data: {
                                clerkId: userId,
                                email,
                                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
                                role: 'OWNER',
                                status: 'ACTIVE',
                                tenant: {
                                    create: {
                                        name: tenantName,
                                        slug,
                                        status: 'PENDING_ACTIVATION'
                                    }
                                }
                            },
                            include: { tenant: true }
                        });

                        client.users.updateUser(userId, {
                            publicMetadata: {
                                tenantId: user.tenantId,
                                role: 'OWNER',
                                dbUserId: user.id,
                                tenantStatus: 'PENDING_ACTIVATION'
                            }
                        }).catch(() => { });
                    }
                }
            } catch (autoCreateError) {
                console.error('[tRPC][createContext] Auto-create user failed:', autoCreateError);
            }
        }

        if (user) {
            setCachedUser(userId, user as any);
        }

        const db = user?.tenantId ? prisma.$extends(tenantExtension(user.tenantId)) : prisma;
        return { db, user, tenantId: user?.tenantId ?? null, headers: requestHeaders };
    } catch (contextError) {
        console.error('[tRPC][createContext] Critical error:', contextError);
        return { db: prisma, user: null, tenantId: null, headers: requestHeaders };
    }
}

const handler = async (req: Request) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createContext(req),
        onError: ({ path, error }) => {
            console.error(`[tRPC][${path}] Error:`, {
                code: error.code,
                message: error.message,
                cause: error.cause instanceof Error ? error.cause.message : error.cause,
            });
        },
    });
};

export { handler as GET, handler as POST };
