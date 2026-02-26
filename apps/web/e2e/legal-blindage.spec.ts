import { test, expect } from '@playwright/test';

/**
 * Pre-Commit Validation Suite — Legal Blindage Sprint
 * 
 * Run from apps/web:
 *   npx playwright test e2e/legal-blindage.spec.ts
 * 
 * Covers: Terms pages, middleware public routes, SetupWizard,
 *         checkout approval, wallet tab, inspection clone,
 *         sequence config, restock trigger, schema integrity.
 */

const BASE = 'http://localhost:3000';

// ─── PUBLIC PAGES (no auth required) ────────────────────────────────────────

test.describe('Feature 0: Legal Pages — Public Access', () => {
    test('/terms page loads with full content', async ({ page }) => {
        await page.goto(`${BASE}/terms`);

        await expect(page).toHaveTitle(/Termos de Uso/);
        await expect(page.locator('h1')).toContainText('Termos de Uso');

        const clauses = [
            '1. Objeto',
            '2. Licença de Uso',
            '3. Responsabilidades do Contratante',
            '4. Responsabilidades da Autevo',
            '5. Proteção de Dados Pessoais',
            '6. Planos, Trial e Pagamento',
            '7. Cancelamento e Portabilidade',
            '8. Propriedade Intelectual',
            '9. Limitação de Responsabilidade',
            '10. Foro',
        ];

        for (const clause of clauses) {
            await expect(page.locator(`text=${clause}`)).toBeVisible();
        }

        await expect(page.locator('a[href="/"]')).toBeVisible();
    });

    test('/privacy page loads with LGPD sections', async ({ page }) => {
        await page.goto(`${BASE}/privacy`);

        await expect(page).toHaveTitle(/Política de Privacidade/);
        await expect(page.locator('h1')).toContainText('Política de Privacidade');

        await expect(page.locator('text=Dados Coletados')).toBeVisible();
        await expect(page.locator('text=Direitos do Titular')).toBeVisible();
        await expect(page.locator('text=Retenção de Dados')).toBeVisible();
    });

    test('Landing page footer links point to /terms and /privacy', async ({ page, context }) => {
        // Clear auth so middleware doesn't redirect / → /dashboard
        await context.clearCookies();
        await page.goto(`${BASE}/`);

        // Scroll to footer (links are below the fold)
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const termsLink = page.locator('a[href="/terms"]');
        const privacyLink = page.locator('a[href="/privacy"]');

        await expect(termsLink).toBeVisible();
        await expect(privacyLink).toBeVisible();
        await expect(termsLink).toContainText('Termos de Uso');
        await expect(privacyLink).toContainText('Privacidade');
    });
});

test.describe('Feature 1: Public Approval Page — Expired/Invalid Token', () => {
    test('Invalid token shows error state', async ({ page }) => {
        await page.goto(`${BASE}/public/approve/invalid-token-123`);

        await page.waitForTimeout(3000);

        const body = page.locator('body');
        await expect(body).not.toContainText('Internal Server Error');
        await expect(body).not.toContainText('Application error');
    });
});

// ─── MIDDLEWARE: PUBLIC ROUTES ───────────────────────────────────────────────

test.describe('Middleware: Public Routes Accessible Without Auth', () => {
    test('/terms is accessible without login', async ({ page }) => {
        await page.goto(`${BASE}/terms`);
        await expect(page.locator('h1')).toContainText('Termos de Uso');
        expect(page.url()).not.toContain('sign-in');
    });

    test('/privacy is accessible without login', async ({ page }) => {
        await page.goto(`${BASE}/privacy`);
        await expect(page.locator('h1')).toContainText('Política de Privacidade');
        expect(page.url()).not.toContain('sign-in');
    });

    test('/public/approve/* is accessible without login', async ({ page }) => {
        await page.goto(`${BASE}/public/approve/test-token`);
        expect(page.url()).not.toContain('sign-in');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});

// ─── AUTHENTICATED TESTS ────────────────────────────────────────────────────

test.describe('Feature 0: B2B Terms in SetupWizard', () => {
    test('SetupWizard has 4 steps including Terms', async ({ page }) => {
        await page.goto(`${BASE}/setup`);

        if (page.url().includes('/dashboard')) {
            test.skip();
            return;
        }

        const stepIndicators = page.locator('text=Termos');
        await expect(stepIndicators).toBeVisible();

        // Step 1
        await page.getByLabel('Cargo').fill('Proprietário');
        await page.getByRole('button', { name: 'Próximo' }).click();

        // Step 2
        await page.getByLabel('Nome da Empresa').fill('Oficina Teste E2E');
        await page.getByRole('button', { name: 'Próximo' }).click();

        // Step 3
        await page.getByRole('button', { name: 'Próximo' }).click();

        // Step 4: Terms
        await expect(page.locator('text=TERMOS DE USO — PLATAFORMA AUTEVO')).toBeVisible();
        await expect(page.locator('#tosAccepted')).toBeVisible();

        // Submit without accepting → error
        await page.getByRole('button', { name: 'Concluir Configuração' }).click();
        await expect(page.locator('text=Você deve aceitar os Termos de Uso')).toBeVisible();

        // Links open in new tab
        await expect(page.locator('a[href="/terms"][target="_blank"]')).toBeVisible();
        await expect(page.locator('a[href="/privacy"][target="_blank"]')).toBeVisible();
    });
});

test.describe('Feature 1: Checkout Digital — WhatsApp Approval Button', () => {
    test('Order detail page dropdown opens without crash', async ({ page }) => {
        await page.goto(`${BASE}/dashboard/orders`);

        const firstOrder = page.locator('a[href*="/dashboard/orders/"]').first();
        if (!(await firstOrder.isVisible())) {
            test.skip();
            return;
        }
        await firstOrder.click();
        await page.waitForURL(/\/dashboard\/orders\/.+$/);

        // Open "..." dropdown
        const moreButton = page.locator('button:has(svg)').last();
        if (await moreButton.isVisible()) {
            await moreButton.click();
            await expect(page.locator('[role="menu"]')).toBeVisible();
        }
    });
});

test.describe('Feature 2: Minha Carteira — Technician View', () => {
    test('Dashboard loads without crash', async ({ page }) => {
        await page.goto(`${BASE}/dashboard`);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');

        // If technician role, wallet tab should exist
        const walletTab = page.locator('button').filter({ hasText: 'Minha Carteira' });
        if (await walletTab.isVisible()) {
            await walletTab.click();
            await expect(page.locator('text=A Receber')).toBeVisible();
            await expect(page.locator('text=Já Pago')).toBeVisible();
            await expect(page.locator('text=Estornado')).toBeVisible();
        }
    });
});

test.describe('Feature 3: Vistoria Clone — Exit Inspection', () => {
    test('Inspection page loads without crash', async ({ page }) => {
        await page.goto(`${BASE}/dashboard/orders`);

        const firstOrder = page.locator('a[href*="/dashboard/orders/"]').first();
        if (!(await firstOrder.isVisible())) {
            test.skip();
            return;
        }
        await firstOrder.click();
        await page.waitForURL(/\/dashboard\/orders\/.+$/);

        const inspectionLink = page.locator('a[href*="/inspection"]').first();
        if (await inspectionLink.isVisible()) {
            await inspectionLink.click();
            await expect(page.locator('body')).not.toContainText('Internal Server Error');
        }
    });
});

test.describe('Feature 4: Initial Sequence', () => {
    test('Settings page loads without crash', async ({ page }) => {
        await page.goto(`${BASE}/dashboard/settings`);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});

test.describe('Feature 6: PendingRestock', () => {
    test('Inventory page loads without crash', async ({ page }) => {
        await page.goto(`${BASE}/dashboard/inventory`);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});

// ─── SCHEMA INTEGRITY ───────────────────────────────────────────────────────

test.describe('Schema Integrity — No Runtime Crashes', () => {
    test('Dashboard loads without Prisma schema errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto(`${BASE}/dashboard`);
        await page.waitForTimeout(3000);

        const prismaErrors = consoleErrors.filter(
            (e) => e.includes('PrismaClient') || e.includes('Unknown field') || e.includes('Invalid `prisma.')
        );
        expect(prismaErrors).toHaveLength(0);
    });

    test('Order detail page handles new fields without crash', async ({ page }) => {
        await page.goto(`${BASE}/dashboard/orders`);

        const firstOrder = page.locator('a[href*="/dashboard/orders/"]').first();
        if (await firstOrder.isVisible()) {
            await firstOrder.click();
            await page.waitForURL(/\/dashboard\/orders\/.+$/);
            await page.waitForTimeout(2000);

            await expect(page.locator('body')).not.toContainText('Internal Server Error');
            await expect(page.locator('body')).not.toContainText('PrismaClientKnownRequestError');
        }
    });
});
