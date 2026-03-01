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

    // Wokaround: Clerk sometimes hangs the Next/Vercel redirect after accepting the valid test code factor-two.
    // Forcing navigation a short time after typing the code causes the browser to evaluate the set auth session and redirect to dashboard.
    await page.waitForTimeout(3000);
    await page.goto('http://localhost:3000/dashboard');

    // Aguarda sucesso
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Salva o JSON da sessão
    await page.context().storageState({ path: authFile });

    console.log('✅ Sessão salva automaticamente no "user.json"!');
});
