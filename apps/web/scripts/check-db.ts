import { prisma } from '@filmtech/database'

async function main() {
    console.log('🔍 Checking Database...')

    const userCount = await prisma.user.count()
    const tenantCount = await prisma.tenant.count()

    console.log(`📊 Total Users: ${userCount}`)
    console.log(`📊 Total Tenants: ${tenantCount}`)

    if (userCount > 0) {
        const lastUser = await prisma.user.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { tenant: true }
        })

        console.log('\n✅ Latest User Found:')
        console.log('--------------------------------------------------')
        console.log(`Name:   ${lastUser?.name}`)
        console.log(`Email:  ${lastUser?.email}`)
        console.log(`Role:   ${lastUser?.role}`)
        console.log(`Tenant: ${lastUser?.tenant.name} (${lastUser?.tenant.status})`)
        console.log('--------------------------------------------------')
    } else {
        console.log('⚠️ No users found. Did you run the trigger-webhook script?')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
