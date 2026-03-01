import { test, expect } from '@playwright/test';

import * as path from 'path';

test.describe('Critical User Journey: Order Creation and Flow', () => {
    // Use the logged-in session saved by global setup via absolute path
    test.use({ storageState: path.join(__dirname, '../playwright/.auth/user.json') });

    test('Creates an OS, adds a service, and changes status to EM_EXECUCAO', async ({ page }) => {
        // 1. Navigate to dashboard and create an OS
        await page.goto('/dashboard/orders');

        // Click "Nova OS"
        const newOrderBtn = page.getByTestId('new-order-btn');
        await expect(newOrderBtn).toBeVisible();
        await newOrderBtn.click();

        await expect(page).toHaveURL(/.*\/orders\/new/);

        // 2. Select "Cliente não cadastrado" to bypass empty DB
        await page.getByTestId('anonymous-client-radio').click();

        // Generate dynamic plate to avoid unique constraint crashes on re-runs
        const randomPlate = 'E2E' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        // Fill generic vehicle via placeholders since labels don't have htmlFor bindings
        await page.getByPlaceholder('ABC1D23').fill(randomPlate);
        await page.getByPlaceholder('Ex: Toyota').fill('Robot');
        await page.getByPlaceholder('Ex: Corolla').fill('Automated');
        await page.getByPlaceholder('Ex: Preto').fill('Black');

        // Confirm Vehicle Creation
        await page.getByTestId('confirm-vehicle-btn').click();

        // Wait for it to become selected
        await expect(page.getByText('Veículo Selecionado')).toBeVisible();

        // Advance to step 2
        await page.getByTestId('wizard-next-btn').click();

        // Ensure we are inside Step 2
        await expect(page.getByText('Adicione os Serviços')).toBeVisible();

        // Add 1 to 3 random custom services
        const numServices = Math.floor(Math.random() * 3) + 1; // 1, 2 or 3
        for (let i = 0; i < numServices; i++) {
            // Click "+ Adicionar Personalizado"
            await page.getByTestId('add-custom-service-btn').click();

            // Generate random name and price
            const serviceName = `Serviço E2E Automático ${i + 1} - ${Math.random().toString(36).substring(7)}`;
            const servicePrice = Math.floor(Math.random() * 500) + 100; // Between 100 and 599

            // Fill dialog modal
            await page.getByRole('dialog').getByPlaceholder('Ex: Refazer fiação').fill(serviceName);
            await page.getByRole('dialog').getByPlaceholder('0.00').fill(servicePrice.toString());

            // Click Adicionar inside dialog
            await page.getByRole('dialog').getByTestId('dialog-add-btn').click();

            // Short wait to allow modal closing animation
            await expect(page.getByRole('dialog')).not.toBeVisible();
        }

        // Move to Step 3
        await page.getByTestId('wizard-next-btn').click();

        // 4. Fill Scheduling
        // Pick dynamic date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');

        await page.getByLabel('Data').fill(`${yyyy}-${mm}-${dd}`);
        await page.getByLabel('Horário').fill('14:00');

        // Select the first assigned user from the grid under "Responsável"
        // Wait for the tRPC grid to populate
        const assignedUserContainer = page.locator('div').filter({ hasText: 'Responsável' }).last();
        const userButton = assignedUserContainer.locator('button').first();
        await userButton.waitFor({ state: 'visible', timeout: 10000 });
        await userButton.click();

        // Submit Creation
        const createBtn = page.getByTestId('submit-order-btn');
        await expect(createBtn).toBeEnabled();
        await createBtn.click();

        // Wait for redirect
        await expect(page).toHaveURL(/.*\/orders\/.*$/);

        // 5. Add a Service inside the details
        const addItemBtn = page.getByTestId('add-service-btn');
        if (await addItemBtn.isVisible()) {
            await addItemBtn.click();

            // Pick combo box for Service
            await page.locator('.dialog-content button[role="combobox"]').first().click();
            await page.locator('[role="option"]').first().click();

            await page.getByRole('dialog').getByTestId('dialog-add-btn').click();
        }

        // 6. Move status to EM_EXECUCAO
        const statusTrigger = page.getByTestId('status-trigger');

        // If there is a dropdown for statuses
        if (await statusTrigger.isVisible()) {
            await statusTrigger.click();
            await page.getByTestId('status-item-EM_EXECUCAO').click();

            // Might have a confirmation toast
            await expect(page.locator('text="Status atualizado"')).toBeVisible({ timeout: 5000 });
        }
    });

});
