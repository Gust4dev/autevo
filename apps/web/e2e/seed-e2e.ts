import { PrismaClient } from '@autevo/database';

const prisma = new PrismaClient();
const CLERK_EMAIL = 'admin+clerk_test@admin.com';

async function seed() {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
        console.warn('⚠️ No CLERK_SECRET_KEY found. Skipping E2E DB Seed.');
        return;
    }

    try {
        console.log(`🔍 Buscando metadata do usuário E2E no Clerk pelo email: ${CLERK_EMAIL}`);
        const response = await fetch(`https://api.clerk.com/v1/users?email_address=${CLERK_EMAIL}`, {
            headers: {
                'Authorization': `Bearer ${clerkSecret}`
            }
        });

        if (!response.ok) {
            throw new Error(`Clerk API erro: ${response.statusText}`);
        }

        const users = await response.json();
        if (!users || users.length === 0) {
            throw new Error(`Nenhum usuário Clerk encontrado com o email ${CLERK_EMAIL}`);
        }

        const clerkUser = users[0];
        const clerkUserId = clerkUser.id;
        const metadata = clerkUser.public_metadata;

        const tenantId = metadata.tenantId || 'e2e-tenant-1234';
        const dbUserId = metadata.dbUserId || 'e2e-user-1234';

        console.log(`⚙️ Injetando Tenant ${tenantId} e User ${dbUserId} no DB Postgres...`);

        // Create Tenant
        await prisma.tenant.upsert({
            where: { id: tenantId },
            update: { status: 'ACTIVE' },
            create: {
                id: tenantId,
                name: 'Oficina E2E Automated',
                slug: 'oficina-e2e',
                status: 'ACTIVE',
                primaryColor: '#DC2626',
                secondaryColor: '#1F2937',
            }
        });

        // Create User linked to Tenant
        await prisma.user.upsert({
            where: { id: dbUserId },
            update: {
                clerkId: clerkUserId,
                role: 'ADMIN_SAAS',
                status: 'ACTIVE',
                tenantId: tenantId
            },
            create: {
                id: dbUserId,
                clerkId: clerkUserId,
                email: CLERK_EMAIL,
                name: 'Robô E2E',
                role: 'ADMIN_SAAS',
                tenantId: tenantId,
                status: 'ACTIVE'
            }
        });

        console.log('✅ Banco de dados E2E provisionado e sincronizado com o Clerk com sucesso!');
    } catch (e) {
        console.error('❌ Erro no seed E2E:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
