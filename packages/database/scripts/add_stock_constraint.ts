import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding stock_non_negative CHECK constraint...');
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD CONSTRAINT "stock_non_negative" CHECK (stock >= 0);`);
        console.log('Successfully added constraint.');
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            console.log('Constraint already exists.');
        } else {
            console.error('Error adding constraint:', error);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
