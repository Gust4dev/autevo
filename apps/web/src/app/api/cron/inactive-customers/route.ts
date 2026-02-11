import { NextResponse } from 'next/server';
import { prisma } from '@autevo/database';

const CRON_SECRET = process.env.CRON_SECRET;
const ANTI_SPAM_DAYS = 7;

interface InactiveCustomer {
    id: string;
    name: string;
    phone: string;
    lastServiceAt: Date;
    daysSinceLastService: number;
}

interface TenantWithInactiveCustomers {
    tenantId: string;
    tenantName: string;
    inactivityDays: number;
    customers: InactiveCustomer[];
}

export async function GET(request: Request): Promise<Response> {
    const authHeader = request.headers.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await processInactiveCustomers();

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            tenantsProcessed: results.length,
            totalCustomersNotified: results.reduce((acc, t) => acc + t.customers.length, 0),
            details: results,
        });
    } catch (error) {
        console.error('[Cron:InactiveCustomers] Error:', error);
        return NextResponse.json(
            { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

async function processInactiveCustomers(): Promise<TenantWithInactiveCustomers[]> {
    const tenants = await prisma.tenant.findMany({
        where: {
            inactivityReminderEnabled: true,
            status: { in: ['ACTIVE', 'TRIAL'] },
        },
        select: {
            id: true,
            name: true,
            customerInactivityDays: true,
        },
    });

    const results: TenantWithInactiveCustomers[] = [];

    for (const tenant of tenants) {
        const inactiveCustomers = await findInactiveCustomers(
            tenant.id,
            tenant.customerInactivityDays
        );

        if (inactiveCustomers.length === 0) continue;

        await createNotificationLogs(tenant.id, inactiveCustomers);
        await updateCustomerReminderTimestamps(inactiveCustomers.map(c => c.id));
        await sendPushToTenantOwners(tenant.id, tenant.name, inactiveCustomers.length);

        results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            inactivityDays: tenant.customerInactivityDays,
            customers: inactiveCustomers,
        });
    }

    return results;
}

async function findInactiveCustomers(
    tenantId: string,
    inactivityDays: number
): Promise<InactiveCustomer[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);

    const antiSpamCutoff = new Date();
    antiSpamCutoff.setDate(antiSpamCutoff.getDate() - ANTI_SPAM_DAYS);

    const customersWithLastOrder = await prisma.customer.findMany({
        where: {
            tenantId,
            deletedAt: null,
            whatsappOptIn: true,
            OR: [
                { lastReminderSentAt: null },
                { lastReminderSentAt: { lt: antiSpamCutoff } },
            ],
        },
        select: {
            id: true,
            name: true,
            phone: true,
            orders: {
                where: { status: 'CONCLUIDO' },
                orderBy: { completedAt: 'desc' },
                take: 1,
                select: { completedAt: true },
            },
        },
    });

    const now = new Date();
    const inactiveCustomers: InactiveCustomer[] = [];

    for (const customer of customersWithLastOrder) {
        const lastOrder = customer.orders[0];
        if (!lastOrder?.completedAt) continue;

        if (lastOrder.completedAt < cutoffDate) {
            const diffTime = now.getTime() - lastOrder.completedAt.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            inactiveCustomers.push({
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                lastServiceAt: lastOrder.completedAt,
                daysSinceLastService: diffDays,
            });
        }
    }

    return inactiveCustomers;
}

async function createNotificationLogs(
    tenantId: string,
    customers: InactiveCustomer[]
): Promise<void> {
    const logs = customers.map(customer => ({
        tenantId,
        customerId: customer.id,
        type: 'LEMBRETE_RETORNO' as const,
        channel: 'system',
        recipient: customer.phone,
        message: `Cliente ${customer.name} não retorna há ${customer.daysSinceLastService} dias`,
        status: 'sent',
        sentAt: new Date(),
    }));

    await prisma.notificationLog.createMany({ data: logs });
}

async function updateCustomerReminderTimestamps(customerIds: string[]): Promise<void> {
    await prisma.customer.updateMany({
        where: { id: { in: customerIds } },
        data: { lastReminderSentAt: new Date() },
    });
}

async function sendPushToTenantOwners(
    tenantId: string,
    tenantName: string,
    customerCount: number
): Promise<void> {
    const { sendPushToOwners } = await import('@/lib/push-notifications');

    await sendPushToOwners(
        tenantId,
        {
            title: '📊 Clientes Inativos',
            body: `${customerCount} cliente${customerCount > 1 ? 's' : ''} não volta${customerCount > 1 ? 'm' : ''} há muito tempo`,
            url: '/dashboard/customers?filter=inactive',
            tag: `inactive-customers-${tenantId}`,
        },
        'onNewCustomer'
    ).catch(() => { });
}
