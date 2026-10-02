import { test, expect } from '@playwright/test';

test.describe('Audit: Browser Console Cleanliness & Error Verification', () => {
  test('verifies zero console errors or uncaught exceptions during full session', async ({ page }) => {
    const consoleErrors: string[] = [];
    const uncaughtExceptions: string[] = [];

    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (error) => uncaughtExceptions.push(error.message));

    await page.goto('/');
    await page.getByRole('button', { name: /Iniciar Experimentos/i }).click();

    await page.getByRole('tab', { name: /^Ir al paso 4\b/ }).click();
    await page.getByRole('tab', { name: /^Ir al paso 5\b/ }).click();

    expect(consoleErrors, `Console errors detected: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(uncaughtExceptions, `Uncaught exceptions detected: ${uncaughtExceptions.join(', ')}`).toEqual([]);
  });
});
