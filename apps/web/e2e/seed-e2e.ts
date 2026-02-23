import { PrismaClient } from '@autevo/database';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function getClerkIdFromAuthJson(): string | null {
    try {
        const authPath = path.join(__dirname, '../playwright/.auth/user.json');
        if (!fs.existsSync(authPath)) return null;

        const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        const sessionCookie = authData.cookies?.find((c: any) => c.name.startsWith('__session'));
        if (!sessionCookie) return null;

        const tokenPayload = sessionCookie.value.split('.')[1];
        if (!tokenPayload) return null;

        const decoded = JSON.parse(Buffer.from(tokenPayload, 'base64').toString('utf8'));
        return decoded.sub; // Clerk ID is always 'sub'
    } catch (e) {
        console.error('Failed to parse user.json for Clerk ID', e);
        return null;
    }
}

async function seed() {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
        console.warn('⚠️ No CLERK_SECRET_KEY found. Skipping E2E DB Seed.');
        return;
    }

    const clerkUserId = getClerkIdFromAuthJson();
    if (!clerkUserId) {
        console.warn('⚠️ No valid user.json or Clerk session cookie found. Skipping E2E DB Seed.');
        return;
    }

    try {
        console.log(`🔍 Buscando metadata do usuário E2E no Clerk: ${clerkUserId}`);
        const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
            headers: {
                'Authorization': `Bearer ${clerkSecret}`
            }
        });

        if (!response.ok) {
            throw new Error(`Clerk API erro: ${response.statusText}`);
        }

        const user = await response.json();
        const metadata = user.public_metadata;

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
                email: 'admin+clerk_test@admin.com',
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
