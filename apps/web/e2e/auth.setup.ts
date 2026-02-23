import { expect, test as setup } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as test user', async ({ page }) => {
    // 1 minuto de timeout
    setup.setTimeout(60000);

    console.log('\n========================================================================');
    console.log('🤖 INICIANDO LOGIN ROBÓTICO AUTOMATIZADO 🤖');
    console.log('Utilizando credenciais de Teste do Clerk: admin+clerk_test@admin.com');
    console.log('========================================================================\n');

    // Em CI, nós injetamos o login gerando um Ticket Bypass pela API do Clerk,
    // garantindo que o Playwright nunca encontre tokens expirados nem o Cloudflare Turnstile.
    if (process.env.CI) {
        console.log('Ambiente CI detectado. Gerando Ticket de Login dinâmico via Clerk API...');
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (!clerkSecret) throw new Error('CLERK_SECRET_KEY must be provided in CI');

        // Fetch User ID
        const usersRes = await fetch(`https://api.clerk.com/v1/users?email_address=admin+clerk_test@admin.com`, {
            headers: { Authorization: `Bearer ${clerkSecret}` }
        });

        if (!usersRes.ok) throw new Error(`Clerk Auth failed: ${usersRes.statusText}`);
        const users = await usersRes.json();
        if (!users || users.length === 0) throw new Error('Test user not found in Clerk');
        const userId = users[0].id;

        // Generate Sign-In Token (Ticket)
        const ticketRes = await fetch(`https://api.clerk.com/v1/sign_in_tokens`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${clerkSecret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        if (!ticketRes.ok) throw new Error(`Clerk Ticket failed: ${ticketRes.statusText}`);

        const ticket = await ticketRes.json();

        // URL with redirect
        const loginUrl = `${ticket.url}&redirect_url=http://localhost:3000/dashboard/orders`;

        await page.goto(loginUrl);
        await page.waitForURL('**/dashboard/**', { timeout: 30000 });

        // Save the dynamic session to user.json for the next tests
        await page.context().storageState({ path: authFile });
        console.log('✅ Sessão dinâmica Clerk salva com sucesso!');
        return;
    }

    await page.goto('http://localhost:3000/sign-in');

    // 1. Email
    await page.waitForSelector('input[name="identifier"]');
    await page.fill('input[name="identifier"]', 'admin+clerk_test@admin.com');
    await page.click('button:has-text("Continue")');

    // 2. Senha
    await page.waitForSelector('input[name="password"]');
    await page.fill('input[name="password"]', 'senhaaleatoria123321!');
    await page.click('button:has-text("Continue")');

    // 3. OTP (Sempre aparece para essa conta teste)
    console.log('Aguardando tela de verificação OTP...');
    // O Clerk gera inputs sequenciais (code-0, code-1...). Busca o primeiro e foca.
    const otpInput = page.locator('input[autocomplete="one-time-code"], input[name="code-0"], .cl-pinCodeInput').first();

    // Aguarda até 30 segundos pela tela de OTP terminar de fazer o slide/fade
    await otpInput.waitFor({ state: 'visible', timeout: 30000 });

    console.log('Tela de OTP carregou. Inserindo 424242...');
    await otpInput.focus();
    await page.keyboard.type('424242');

    // Aguarda sucesso
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Salva o JSON da sessão
    await page.context().storageState({ path: authFile });

    console.log('✅ Sessão salva automaticamente no "user.json"!');
});
