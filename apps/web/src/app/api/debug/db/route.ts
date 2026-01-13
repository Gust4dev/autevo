import { prisma } from '@autevo/database'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        console.log('[Debug] Testing database connection...');

        const userCount = await prisma.user.count();
        const tenantCount = await prisma.tenant.count();

        console.log('[Debug] Database OK - Users:', userCount, 'Tenants:', tenantCount);

        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            counts: {
                users: userCount,
                tenants: tenantCount
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Debug] Database connection error:', error);
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
