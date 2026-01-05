import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import { appRouter } from '@/server/routers/_app';
import { prisma, type User } from '@filmtech/database';
import type { Context } from '@/server/trpc';
import { clerkClient } from '@clerk/nextjs/server';
import { getCachedUser, setCachedUser, isCacheValid } from '@/lib/user-cache';

async function createContext(): Promise<Context> {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return { db: prisma, user: null, tenantId: null };
    }

    if (isCacheValid(userId)) {
        const cached = getCachedUser(userId);
        if (cached) {
            return { db: prisma, user: cached.user, tenantId: cached.user.tenantId };
        }
    }

    let user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { tenant: true },
    });

    // Sync Clerk metadata if out of date
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

            if (email) {
                const userCount = await prisma.user.count();
                const isFirstUser = userCount === 0;

                if (isFirstUser) {
                    // First user becomes OWNER with new tenant
                    user = await prisma.user.create({
                        data: {
                            clerkId: userId,
                            email,
                            name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || email,
                            role: 'OWNER',
                            status: 'ACTIVE',
                            tenant: {
                                create: {
                                    name: "Minha Empresa",
                                    slug: `${email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}`,
                                    status: 'ACTIVE'
                                }
                            }
                        },
                        include: { tenant: true }
                    });

                    client.users.updateUser(userId, {
                        publicMetadata: { tenantId: user.tenantId, role: user.role, dbUserId: user.id }
                    }).catch(() => { });
                } else {
                    // New user - placeholder tenant, redirect to /welcome
                    const placeholderTenant = await prisma.tenant.findFirst({
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'asc' }
                    });

                    if (placeholderTenant) {
                        user = await prisma.user.create({
                            data: {
                                clerkId: userId,
                                email,
                                name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || email,
                                role: 'MEMBER',
                                status: 'ACTIVE',
                                tenantId: placeholderTenant.id
                            },
                            include: { tenant: true }
                        });

                        client.users.updateUser(userId, {
                            publicMetadata: {
                                tenantId: user.tenantId,
                                role: user.role,
                                dbUserId: user.id,
                                needsOnboarding: true
                            }
                        }).catch(() => { });
                    }
                }
            }
        } catch (error) {
            console.error("[AuthSync] Sync failed:", error);
        }
    }

    if (user) {
        setCachedUser(userId, user as any);
    }

    return { db: prisma, user, tenantId: user?.tenantId ?? null };
}

const handler = async (req: Request) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext,
        onError: process.env.NODE_ENV === 'development'
            ? ({ path, error }) => console.error(`tRPC error on ${path ?? '<no-path>'}:`, error.message)
            : undefined,
    });
};

export { handler as GET, handler as POST };
