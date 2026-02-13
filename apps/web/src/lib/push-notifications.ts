import webpush from 'web-push';
import { prisma } from '@autevo/database';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_PWA_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.PWA_PRIVATE_KEY;

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('VAPID keys not configured. Push notifications will not work.');
}

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails(
        'mailto:suporte@autevo.com.br',
        VAPID_PUBLIC,
        VAPID_PRIVATE
    );
}

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
}

async function sendToSubscription(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: NotificationPayload
): Promise<boolean> {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                },
            },
            JSON.stringify({
                ...payload,
                icon: payload.icon || '/branding/icon-192x192.png',
            })
        );
        return true;
    } catch (error) {
        const webPushError = error as { statusCode?: number };
        if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            await prisma.pushSubscription.deleteMany({
                where: { endpoint: subscription.endpoint },
            });
        }
        return false;
    }
}

export async function sendPushToUser(
    userId: string,
    payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
    const prefs = await prisma.notificationPreferences.findUnique({
        where: { userId },
    });

    if (!prefs) {
        return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
        select: { endpoint: true, p256dh: true, auth: true },
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
        const success = await sendToSubscription(sub, payload);
        if (success) sent++;
        else failed++;
    }

    return { sent, failed };
}

export async function sendPushToOwners(
    tenantId: string,
    payload: NotificationPayload,
    notificationType: 'onNewOrder' | 'onNewCustomer' | 'onOrderCompleted'
): Promise<{ sent: number; failed: number }> {
    const owners = await prisma.user.findMany({
        where: {
            tenantId,
            role: { in: ['OWNER', 'MANAGER'] },
            isActive: true,
        },
        select: {
            id: true,
            notificationPreferences: {
                select: {
                    onNewOrder: true,
                    onNewCustomer: true,
                    onOrderCompleted: true,
                },
            },
            pushSubscriptions: {
                select: { endpoint: true, p256dh: true, auth: true },
            },
        },
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const owner of owners) {
        const prefs = owner.notificationPreferences;
        if (!prefs || !prefs[notificationType]) continue;

        for (const sub of owner.pushSubscriptions) {
            const success = await sendToSubscription(sub, payload);
            if (success) totalSent++;
            else totalFailed++;
        }
    }

    return { sent: totalSent, failed: totalFailed };
}

export async function sendPushToMember(
    userId: string,
    payload: NotificationPayload,
    notificationType: 'onAssignedToMe' | 'onMyOrderStatusChange' | 'dailyReminder'
): Promise<{ sent: number; failed: number }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            notificationPreferences: {
                select: {
                    onAssignedToMe: true,
                    onMyOrderStatusChange: true,
                    dailyReminder: true,
                },
            },
            pushSubscriptions: {
                select: { endpoint: true, p256dh: true, auth: true },
            },
        },
    });

    if (!user?.notificationPreferences?.[notificationType]) {
        return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const sub of user.pushSubscriptions) {
        const success = await sendToSubscription(sub, payload);
        if (success) sent++;
        else failed++;
    }

    return { sent, failed };
}
