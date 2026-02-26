import { NextResponse } from 'next/server';
import { prisma } from '@autevo/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();

        const result = await prisma.serviceOrder.updateMany({
            where: {
                approvalToken: { not: null },
                approvalTokenExpiry: { lt: now },
            },
            data: {
                approvalToken: null,
                approvalTokenExpiry: null,
            },
        });

        return NextResponse.json({
            success: true,
            expiredTokensCleared: result.count,
            executedAt: now.toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Token cleanup error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
