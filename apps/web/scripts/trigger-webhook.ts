import { Webhook } from 'svix'
import fs from 'fs'
import path from 'path'

// 1. Load Environment Variables from .env.local manually
// (Since we are running this as a standalone script, Next.js env loading doesn't happen automatically)
const envPaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps', 'web', '.env.local'),
    path.resolve(process.cwd(), '..', '.env.local') // In case we are deep in folders
]

let webhookSecret = process.env.CLERK_WEBHOOK_SECRET

if (!webhookSecret) {
    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            console.log(`Checking .env at: ${envPath}`)
            const envConfig = fs.readFileSync(envPath, 'utf8')
            for (const line of envConfig.split('\n')) {
                const [key, val] = line.split('=')
                if (key?.trim() === 'CLERK_WEBHOOK_SECRET') {
                    webhookSecret = val?.trim().replace(/^["']|["']$/g, '')
                    break
                }
            }
        }
        if (webhookSecret) break
    }
}

if (!webhookSecret) {
    console.error('❌ Error: CLERK_WEBHOOK_SECRET not found in .env.local or environment variables.')
    console.error('Please make sure you have added it to apps/web/.env.local')
    process.exit(1)
}

// 2. Define the payload (Simulating a Clerk user.created event)
// You can edit 'public_metadata' here to test Invites vs Organic signups
const payload = {
    "data": {
        "birthday": "",
        "created_at": Date.now(),
        "email_addresses": [
            {
                "email_address": `test.user.${Date.now()}@example.com`,
                "id": "idn_test123",
                "linked_to": [],
                "object": "email_address",
                "verification": {
                    "status": "verified",
                    "strategy": "ticket"
                }
            }
        ],
        "external_accounts": [],
        "external_id": null,
        "first_name": "Test",
        "gender": "",
        "id": `user_test_${Date.now()}`,
        "image_url": "https://img.clerk.com/preview.png",
        "last_name": "User",
        "last_sign_in_at": null,
        "object": "user",
        "password_enabled": true,
        "phone_numbers": [],
        "primary_email_address_id": "idn_test123",
        "primary_phone_number_id": null,
        "primary_web3_wallet_id": null,
        "private_metadata": {},
        "public_metadata": {
            // UNCOMMENT THE LINES BELOW TO TEST INVITE FLOW:
            // "tenantId": "cm4...your_tenant_id_here", 
            // "role": "MEMBER"
        },
        "two_factor_enabled": false,
        "unsafe_metadata": {},
        "updated_at": Date.now(),
        "username": null,
        "web3_wallets": []
    },
    "object": "event",
    "type": "user.created"
}

// 3. Generate Svix Headers
const body = JSON.stringify(payload)
const wh = new Webhook(webhookSecret)
const timestamp = Math.floor(Date.now() / 1000)
const msgId = `msg_${Date.now()}`

// Webhook.sign(msgId, timestamp, body)
const signature = wh.sign(msgId, new Date(timestamp * 1000), body) as string

// 4. Send Request to Localhost
async function trigger() {
    console.log('🚀 Sending mock Clerk Webhook to http://localhost:3000/api/webhooks/clerk...')
    console.log(`Checking Secret... ${webhookSecret?.slice(0, 5)}...`)

    try {
        const res = await fetch('http://localhost:3000/api/webhooks/clerk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'svix-id': msgId,
                'svix-timestamp': timestamp.toString(),
                'svix-signature': signature
            },
            body: body
        })

        if (res.ok) {
            console.log('✅ Success! Webhook processed. Check your database / server logs.')
        } else {
            console.error(`❌ Failed: Server returned ${res.status} ${res.statusText}`)
            const text = await res.text()
            console.error('Response:', text)
        }
    } catch (error) {
        console.error('❌ Network Error: Make sure your Next.js server is running on port 3000.')
        console.error(error)
    }
}

trigger()
