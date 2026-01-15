import { NextResponse } from 'next/server';
import { prisma } from '@autevo/database';

export async function GET() {
    try {
        const count = await prisma.tenant.count({
            where: { isFoundingMember: true },
        });
        return NextResponse.json({ count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
