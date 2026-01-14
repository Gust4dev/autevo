import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@autevo/database'
import { UserRole } from '@prisma/client'

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        return new Response('Error occured', {
            status: 400
        })
    }

    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data as any;

        const email = email_addresses?.[0]?.email_address
        const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'Usuário Sem Nome'

        if (!email) {
            return new Response('Error: No email found in user data', { status: 400 })
        }

        const clerk = await import('@clerk/nextjs/server').then(m => m.clerkClient())

        try {
            const existingUser = await prisma.user.findFirst({
                where: { email },
                include: { tenant: { select: { status: true } } }
            });

            const sentTenantId = public_metadata?.tenantId as string | undefined;

            if (existingUser) {
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

                return new Response('User linked', { status: 200 });
            }

            if (sentTenantId) {
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
                return new Response('User created in existing tenant', { status: 200 });
            }

            const tenantName = `Estética de ${first_name ?? 'Usuário'}`.trim()
            const baseSlug = tenantName.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            let slug = baseSlug;
            const existingTenant = await prisma.tenant.findUnique({
                where: { slug },
                select: { id: true },
            });

            if (existingTenant) {
                slug = `${baseSlug}-${Math.random().toString(36).substring(2, 5)}`;
            }

            await prisma.$transaction(async (tx) => {
                const newTenant = await tx.tenant.create({
                    data: {
                        name: tenantName,
                        slug,
                        status: 'PENDING_ACTIVATION',
                    }
                })

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

                await clerk.users.updateUser(id, {
                    publicMetadata: {
                        tenantId: newTenant.id,
                        role: 'OWNER',
                        dbUserId: newUser.id,
                        tenantStatus: 'PENDING_ACTIVATION',
                    }
                });
            })

        } catch (error) {
            return new Response('Error creating user in database', { status: 500 })
        }
    }

    return new Response('', { status: 200 })
}
