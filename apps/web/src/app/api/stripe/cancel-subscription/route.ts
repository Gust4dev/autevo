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

        // Require explicit confirmation
        if (confirmationText !== 'CANCELAR ASSINATURA') {
            return NextResponse.json({
                error: 'Confirmação inválida. Digite "CANCELAR ASSINATURA" para confirmar.'
            }, { status: 400 });
        }

        // Get user and tenant
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

        // Cancel Stripe subscription if exists
        if (subscription?.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
                    cancellation_details: {
                        comment: 'User requested account deletion',
                    },
                });
            } catch (stripeError) {
                console.error('[Cancel] Stripe cancellation error:', stripeError);
                // Continue with deletion even if Stripe fails
            }
        }

        // Get all users from this tenant to delete from Clerk
        const tenantUsers = await prisma.user.findMany({
            where: { tenantId },
            select: { clerkId: true },
        });

        // Delete tenant and all related data
        // Explicitly delete models that don't have onDelete: Cascade in schema
        await prisma.$transaction(async (tx) => {
            // 1. Delete data related to ServiceOrder that doesn't cascade
            await tx.payment.deleteMany({
                where: { order: { tenantId } },
            });

            // 2. Delete Inspection data (it doesn't cascade from ServiceOrder in current schema)
            await tx.inspectionItem.deleteMany({
                where: { inspection: { order: { tenantId } } },
            });
            await tx.inspectionDamage.deleteMany({
                where: { inspection: { order: { tenantId } } },
            });
            await tx.inspection.deleteMany({
                where: { order: { tenantId } },
            });

            // 3. Delete AuditLogs and other tenant-specific data
            await tx.auditLog.deleteMany({
                where: { tenantId },
            });

            // 4. Delete Subscription and Payments if not handled by cascade
            // Although cascade is in schema, explicit deletion ensures data integrity during this flow
            if (subscription) {
                await tx.subscriptionPayment.deleteMany({
                    where: { subscriptionId: subscription.id },
                });
                await tx.subscription.delete({
                    where: { tenantId },
                });
            }

            // 5. Finally delete the Tenant
            // This will trigger Cascade delete for:
            // - User, Customer, Vehicle, Service, Product, ServiceOrder,
            // - CommissionSettlement, NotificationLog, MessageTemplate
            await tx.tenant.delete({
                where: { id: tenantId },
            });
        });

        // Delete users from Clerk
        const clerk = await clerkClient();
        for (const tenantUser of tenantUsers) {
            if (tenantUser.clerkId) {
                try {
                    await clerk.users.deleteUser(tenantUser.clerkId);
                } catch (clerkError) {
                    console.error('[Cancel] Clerk user deletion error:', clerkError);
                    // Continue even if Clerk deletion fails
                }
            }
        }

        // Decrement founder slots if was founder
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
