import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@filmtech/database'
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
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

        const email = email_addresses[0]?.email_address
        const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'Usuário Sem Nome'

        if (!email) {
            return new Response('Error: No email found in user data', { status: 400 })
        }

        const tenantId = public_metadata?.tenantId as string | undefined
        const roleStr = public_metadata?.role as string | undefined

        let role: UserRole = UserRole.MEMBER
        if (roleStr && Object.values(UserRole).includes(roleStr as UserRole)) {
            role = roleStr as UserRole
        }

        try {
            const dbUserId = public_metadata?.dbUserId as string | undefined

            if (tenantId) {
                // SCENARIO A: Invite Flow (Tenant already exists)

                if (dbUserId) {
                    // Update pre-created user
                    await prisma.user.update({
                        where: { id: dbUserId },
                        data: {
                            clerkId: id,
                            avatarUrl: image_url,
                            status: 'ACTIVE',
                        }
                    })
                    console.log(`[Webhook] Pre-created User ${dbUserId} linked to Clerk ID ${id}`)
                } else {
                    // Legacy: Create new user if not pre-created
                    await prisma.user.create({
                        data: {
                            clerkId: id,
                            email,
                            name,
                            avatarUrl: image_url,
                            role,
                            tenantId,
                            status: 'ACTIVE',
                        }
                    })
                    console.log(`[Webhook] User ${id} created and linked to tenant ${tenantId} as ${role}`)
                }
            } else {
                // SCENARIO B: Organic/Trial Flow (New Tenant)
                const tenantName = `Oficina de ${first_name ?? 'Usuário'}`.trim()
                const baseSlug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                const slug = `${baseSlug}-${Date.now().toString(36)}`

                await prisma.$transaction(async (tx) => {
                    const newTenant = await tx.tenant.create({
                        data: {
                            name: tenantName,
                            slug,
                            status: 'TRIAL',
                            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        }
                    })

                    await tx.user.create({
                        data: {
                            clerkId: id,
                            email,
                            name,
                            avatarUrl: image_url,
                            role: UserRole.OWNER,
                            tenantId: newTenant.id,
                        }
                    })

                    console.log(`[Webhook] Created new tenant ${newTenant.id} and owner ${id}`)
                })
            }
        } catch (error) {
            console.error('[Webhook] Error creating user in database:', error)
            return new Response('Error creating user in database', { status: 500 })
        }
    }

    return new Response('', { status: 200 })
}
