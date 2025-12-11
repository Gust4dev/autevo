import { NextResponse } from 'next/server';
import { prisma } from '@filmtech/database';

// Neon warmup - called by Vercel Cron every 5min during business hours
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: 'ok',
            latency: Date.now() - start,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            { status: 'error', error: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
