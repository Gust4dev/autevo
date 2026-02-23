import 'dotenv/config';

async function test() {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    console.log(clerkSecret?.substring(0, 10));

    // Test URL param encoding
    const email = 'admin+clerk_test@admin.com';
    const response = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${clerkSecret}` }
    });
    console.log(await response.json());
}
test();
