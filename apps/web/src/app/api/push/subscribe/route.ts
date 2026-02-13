import { auth } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = subscriptionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid subscription data', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { endpoint, keys } = parsed.data;

        const dbUser = await prisma.user.findFirst({
            where: { clerkId },
            select: { id: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth,
                userId: dbUser.id,
            },
            create: {
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                userId: dbUser.id,
            },
        });

        await prisma.notificationPreferences.upsert({
            where: { userId: dbUser.id },
            update: {},
            create: {
                userId: dbUser.id,
                onNewOrder: true,
                onNewCustomer: true,
                onOrderCompleted: true,
                onAssignedToMe: true,
                onMyOrderStatusChange: true,
                dailyReminder: false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push subscription error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint || typeof endpoint !== 'string') {
            return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
        }

        await prisma.pushSubscription.deleteMany({
            where: { endpoint },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
