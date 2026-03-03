import { PrismaClient, Prisma } from '@prisma/client';

function validateDMMF(): void {
    const modelNames = Prisma.dmmf?.datamodel?.models?.map(m => m.name) ?? [];
    if (modelNames.length === 0) {
        console.warn(
            '[SECURITY_WARN] Prisma DMMF metadata failed to load. ' +
            'Tenant isolation will rely on the static hardcoded fallback array. ' +
            'This is normal in Vercel Edge/Serverless optimized builds.'
        );
    }
}

validateDMMF();

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

prisma.$connect().catch(() => { });

export * from '@prisma/client';
export { Prisma } from '@prisma/client';
