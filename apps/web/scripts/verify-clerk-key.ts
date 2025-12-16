import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('🔍 Verifying Clerk Key (Direct Fetch)...');

    // 1. Load Env
    const possiblePaths = [
        path.resolve(__dirname, '../.env.local'), // When running from apps/web/scripts
        path.resolve(__dirname, '../../.env.local'), // When running from root/apps/web/scripts (if cwd is root)
        path.join(process.cwd(), 'apps/web/.env.local'), // From root
        path.join(process.cwd(), '.env.local') // From apps/web
    ];

    let secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
        console.log('🔄 Searching for .env.local...');
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                console.log(`📄 Found .env at: ${p}`);
                dotenv.config({ path: p });
                secretKey = process.env.CLERK_SECRET_KEY;
                if (secretKey) break;
            }
        }
    }

    if (!secretKey) {
        console.error('❌ Error: COULD NOT FIND CLERK_SECRET_KEY in any checked path.');
        console.log('Checked paths:', possiblePaths);
        process.exit(1);
    }

    console.log(`🔑 Key found: ${secretKey.slice(0, 7)}...`);

    // 2. Test API
    try {
        const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
            headers: {
                'Authorization': `Bearer ${secretKey}`
            }
        });

        if (response.status === 200) {
            console.log('✅ SUCCESSO! Chave válida e funcionando.');
            const data = await response.json();
            console.log(`📊 Conectado. Total de usuários (na query): ${data.length}`);
        } else {
            console.error(`❌ FALHA NA API: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error('Resposta:', errorBody);
        }
    } catch (err) {
        console.error('❌ Erro de conexão:', err);
    }
}

main();
