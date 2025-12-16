import { createClerkClient } from '@clerk/nextjs/server';
import 'dotenv/config'; // Try to load .env manually if needed, or rely on next env

async function main() {
    console.log('🔍 Checking Clerk Configuration...');

    const secretKey = process.env.CLERK_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!secretKey) {
        console.error('❌ Error: CLERK_SECRET_KEY is missing from environment.');
        process.exit(1);
    } else {
        console.log(`✅ CLERK_SECRET_KEY found (${secretKey.slice(0, 8)}...)`);
    }

    if (!publishableKey) {
        console.error('❌ Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing from environment.');
    } else {
        console.log(`✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY found (${publishableKey.slice(0, 8)}...)`);
    }

    try {
        const clerk = createClerkClient({ secretKey });
        console.log('🔄 Attempting to fetch explicit clerk client...');

        // Simplest call to verify auth - list 1 user
        const users = await clerk.users.getUserList({ limit: 1 });
        console.log('✅ Connection Successful! Found ' + users.totalCount + ' users in Clerk.');
    } catch (error: any) {
        console.error('❌ Clerk Connection Failed:');
        console.error(error.message || error);
    }
}

main();
