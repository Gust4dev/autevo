import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@autevo/database';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * Cancel subscription and permanently delete the account.
 * This is a destructive operation - all data will be lost.
 */
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { confirmationText } = body;


        if (confirmationText !== 'CANCELAR ASSINATURA') {
            return NextResponse.json({
                error: 'Confirmação inválida. Digite "CANCELAR ASSINATURA" para confirmar.'
            }, { status: 400 });
        }


        const user = await prisma.user.findFirst({
            where: { clerkId: session.userId },
            include: { tenant: true },
        });

        if (!user?.tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const tenantId = user.tenantId;

        // Get subscription
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
        });


        if (subscription?.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
                    cancellation_details: {
                        comment: 'User requested account deletion',
                    },
                });
            } catch (stripeError) {
                console.error('[Cancel] Stripe cancellation error:', stripeError);

            }
        }


        const tenantUsers = await prisma.user.findMany({
            where: { tenantId },
            select: { clerkId: true },
        });


        await prisma.$transaction(async (tx) => {

            await tx.payment.deleteMany({
                where: { order: { tenantId } },
            });


            await tx.inspectionItem.deleteMany({
                where: { inspection: { order: { tenantId } } },
            });
            await tx.inspectionDamage.deleteMany({
                where: { inspection: { order: { tenantId } } },
            });
            await tx.inspection.deleteMany({
                where: { order: { tenantId } },
            });


            await tx.auditLog.deleteMany({
                where: { tenantId },
            });


            if (subscription) {
                await tx.subscriptionPayment.deleteMany({
                    where: { subscriptionId: subscription.id },
                });
                await tx.subscription.delete({
                    where: { tenantId },
                });
            }


            await tx.tenant.delete({
                where: { id: tenantId },
            });
        });


        const clerk = await clerkClient();
        for (const tenantUser of tenantUsers) {
            if (tenantUser.clerkId) {
                try {
                    await clerk.users.deleteUser(tenantUser.clerkId);
                } catch (clerkError) {
                    console.error('[Cancel] Clerk user deletion error:', clerkError);

                }
            }
        }


        if (subscription?.isFounder) {
            await prisma.founderSlot.updateMany({
                data: { usedSlots: { decrement: 1 } },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully',
            redirect: '/',
        });
    } catch (error) {
        console.error('[Cancel Subscription Error]', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
