// Script para gerar VAPID keys válidas
// Execute com: node generate-vapid.js

const webpush = require("web-push");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("=== VAPID KEYS GERADAS ===\n");
console.log("Adicione ao seu .env.local:\n");
console.log(`NEXT_PUBLIC_PWA_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`NEXT_PUBLIC_PWA_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log("\nE no Vercel, adicione as mesmas variáveis.");
