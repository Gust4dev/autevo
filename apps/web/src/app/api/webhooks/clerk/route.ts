import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@autevo/database'
import { UserRole } from '@prisma/client'

export async function POST(req: Request) {
    console.log('[Webhook] ========== CLERK WEBHOOK RECEIVED ==========');
    console.log('[Webhook] Timestamp:', new Date().toISOString());

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        console.error('[Webhook] ERROR: CLERK_WEBHOOK_SECRET not configured');
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }
    console.log('[Webhook] WEBHOOK_SECRET exists:', WEBHOOK_SECRET.substring(0, 10) + '...');

    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    console.log('[Webhook] Svix Headers:', { svix_id: !!svix_id, svix_timestamp: !!svix_timestamp, svix_signature: !!svix_signature });

    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('[Webhook] ERROR: Missing svix headers');
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)
    console.log('[Webhook] Payload event type:', payload.type);
    console.log('[Webhook] Payload data ID:', payload.data?.id);

    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
        console.log('[Webhook] Verification PASSED');
    } catch (err) {
        console.error('[Webhook] Verification FAILED:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    const eventType = evt.type;
    console.log('[Webhook] Processing event type:', eventType);

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data as any;

        const email = email_addresses?.[0]?.email_address
        const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'Usuário Sem Nome'

        console.log('[Webhook] user.created event data:', {
            clerkId: id,
            email,
            name,
            first_name,
            last_name,
            hasTenantIdInMetadata: !!public_metadata?.tenantId
        });

        if (!email) {
            console.error('[Webhook] ERROR: No email in user data');
            return new Response('Error: No email found in user data', { status: 400 })
        }

        const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient())

        try {
            console.log('[Webhook] Checking if user exists in DB...');
            const existingUser = await prisma.user.findFirst({
                where: { email },
                include: { tenant: { select: { status: true } } }
            });
            console.log('[Webhook] Existing user found:', existingUser ? existingUser.id : 'NO');

            const sentTenantId = public_metadata?.tenantId as string | undefined;

            if (existingUser) {
                console.log('[Webhook] Updating existing user with clerkId...');
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        clerkId: id,
                        avatarUrl: image_url || existingUser.avatarUrl,
                        status: 'ACTIVE',
                    }
                });

                await clerk.users.updateUser(id, {
                    publicMetadata: {
                        tenantId: existingUser.tenantId,
                        role: existingUser.role,
                        dbUserId: existingUser.id,
                        tenantStatus: existingUser.tenant?.status || 'ACTIVE',
                    }
                });

                console.log('[Webhook] SUCCESS: Existing user linked');
                return new Response('User linked', { status: 200 });
            }

            if (sentTenantId) {
                console.log('[Webhook] Creating user in existing tenant:', sentTenantId);
                await prisma.user.create({
                    data: {
                        clerkId: id,
                        email,
                        name,
                        avatarUrl: image_url,
                        role: (public_metadata?.role as UserRole) || UserRole.MEMBER,
                        tenantId: sentTenantId,
                        status: 'ACTIVE',
                    }
                });
                console.log('[Webhook] SUCCESS: User created in existing tenant');
                return new Response('User created in existing tenant', { status: 200 });
            }

            console.log('[Webhook] Creating NEW tenant and user...');
            const tenantName = `Estética de ${first_name ?? 'Usuário'}`.trim()
            const baseSlug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
            const slug = `${baseSlug}-${Date.now().toString(36)}`
            console.log('[Webhook] Tenant details:', { tenantName, slug });

            await prisma.$transaction(async (tx) => {
                console.log('[Webhook] Starting transaction...');
                const newTenant = await tx.tenant.create({
                    data: {
                        name: tenantName,
                        slug,
                        status: 'PENDING_ACTIVATION',
                    }
                })
                console.log('[Webhook] Tenant created:', newTenant.id);

                const newUser = await tx.user.create({
                    data: {
                        clerkId: id,
                        email,
                        name,
                        avatarUrl: image_url,
                        role: UserRole.OWNER,
                        tenantId: newTenant.id,
                        status: 'ACTIVE'
                    }
                })
                console.log('[Webhook] User created:', newUser.id);

                await clerk.users.updateUser(id, {
                    publicMetadata: {
                        tenantId: newTenant.id,
                        role: 'OWNER',
                        dbUserId: newUser.id,
                        tenantStatus: 'PENDING_ACTIVATION',
                    }
                });
                console.log('[Webhook] Clerk metadata updated');
            })

            console.log('[Webhook] SUCCESS: New tenant and user created');

        } catch (error) {
            console.error('[Webhook] ERROR creating user:', error)
            return new Response('Error creating user in database', { status: 500 })
        }
    }

    console.log('[Webhook] ========== WEBHOOK COMPLETE ==========');
    return new Response('', { status: 200 })
}
