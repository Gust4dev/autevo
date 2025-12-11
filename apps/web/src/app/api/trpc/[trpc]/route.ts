import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import { appRouter } from '@/server/routers/_app';
import { prisma } from '@filmtech/database';
import type { Context } from '@/server/trpc';

async function createContext(): Promise<Context> {
    const { userId } = await auth();

    if (!userId) {
        return { db: prisma, user: null, tenantId: null };
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { tenant: true },
    });

    return {
        db: prisma,
        user,
        tenantId: user?.tenantId ?? null,
    };
}

const handler = async (req: Request) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext,
        onError:
            process.env.NODE_ENV === 'development'
                ? ({ path, error }) => {
                    console.error(`tRPC error on ${path ?? '<no-path>'}:`, error.message);
                }
                : undefined,
    });
};

export { handler as GET, handler as POST };
