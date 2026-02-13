import { auth } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { NextResponse } from 'next/server';
import { sendPushToUser } from '@/lib/push-notifications';

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findFirst({
            where: { clerkId },
            select: {
                id: true,
                role: true,
                _count: { select: { pushSubscriptions: true } },
                notificationPreferences: { select: { id: true } },
            },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        if (!['ADMIN_SAAS', 'OWNER', 'MANAGER'].includes(dbUser.role)) {
            return NextResponse.json({ error: 'Admin/Owner only' }, { status: 403 });
        }

        const diagnostics = {
            userId: dbUser.id,
            subscriptionCount: dbUser._count.pushSubscriptions,
            hasPreferences: !!dbUser.notificationPreferences,
            vapidPublicConfigured: !!process.env.NEXT_PUBLIC_PWA_PUBLIC_KEY,
            vapidPrivateConfigured: !!process.env.PWA_PRIVATE_KEY,
        };

        if (dbUser._count.pushSubscriptions === 0) {
            return NextResponse.json({
                success: false,
                error: 'No push subscriptions found. Enable notifications first.',
                diagnostics,
            });
        }

        if (!dbUser.notificationPreferences) {
            return NextResponse.json({
                success: false,
                error: 'No notification preferences found. Toggle notifications off/on to fix.',
                diagnostics,
            });
        }

        const result = await sendPushToUser(dbUser.id, {
            title: '🔔 Teste de Notificação',
            body: 'Push notifications estão funcionando corretamente!',
            url: '/dashboard/settings',
            tag: 'push-test',
        });

        return NextResponse.json({
            success: result.sent > 0,
            result,
            diagnostics,
        });
    } catch (error) {
        console.error('Push test error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
