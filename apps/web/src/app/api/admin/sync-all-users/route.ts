import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@filmtech/database';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Admin endpoint to force sync all users between Prisma and Clerk
 * This is useful if metadata gets out of sync
 * 
 * Usage: POST /api/admin/sync-all-users
 * Requires: ADMIN_SAAS role
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify caller is ADMIN_SAAS
        const caller = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (caller?.role !== 'ADMIN_SAAS') {
            return NextResponse.json({ error: 'Forbidden - ADMIN_SAAS required' }, { status: 403 });
        }

        // Get all users with clerkId
        const users = await prisma.user.findMany({
            where: {
                clerkId: { not: null }
            },
            select: {
                id: true,
                clerkId: true,
                role: true,
                tenantId: true,
            },
        });

        const client = await clerkClient();
        const results: { userId: string; success: boolean; error?: string }[] = [];

        for (const user of users) {
            if (!user.clerkId) continue;

            try {
                await client.users.updateUser(user.clerkId, {
                    publicMetadata: {
                        tenantId: user.tenantId,
                        role: user.role,
                        dbUserId: user.id,
                    },
                });
                results.push({ userId: user.id, success: true });
            } catch (error: any) {
                results.push({
                    userId: user.id,
                    success: false,
                    error: error.message || 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            message: `Synced ${successCount} users, ${failCount} failures`,
            results,
        });
    } catch (error: any) {
        console.error('[Admin Sync] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}

// GET endpoint to check sync status
export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const caller = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (caller?.role !== 'ADMIN_SAAS') {
            return NextResponse.json({ error: 'Forbidden - ADMIN_SAAS required' }, { status: 403 });
        }

        // Check for potential sync issues
        const users = await prisma.user.findMany({
            where: { clerkId: { not: null } },
            select: {
                id: true,
                clerkId: true,
                email: true,
                role: true,
                tenantId: true,
                status: true,
            },
        });

        // Identify potential issues
        const issues = users.filter(u =>
            !u.tenantId || u.status === 'INVITED'
        );

        return NextResponse.json({
            totalUsers: users.length,
            usersWithIssues: issues.length,
            issues: issues.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role,
                status: u.status,
                hasTenant: !!u.tenantId,
            })),
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
