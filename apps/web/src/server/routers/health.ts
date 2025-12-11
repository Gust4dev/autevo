import { router, publicProcedure } from '../trpc';

export const healthRouter = router({
    check: publicProcedure.query(() => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
    })),

    ping: publicProcedure.query(async ({ ctx }) => {
        const start = Date.now();
        await ctx.db.$queryRaw`SELECT 1`;
        return {
            status: 'ok',
            latency: Date.now() - start,
            timestamp: new Date().toISOString(),
        };
    }),
});
