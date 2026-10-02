import { test, expect } from '@playwright/test';

test.describe('Phase 1: E2E Baseline Smoke Flow', () => {
  test('verifies home page loads correctly and displays brand header', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/QuantumLab 3D/i);

    const brandHeading = page.locator('header').getByText(/QUANTUMLAB/i);
    await expect(brandHeading).toBeVisible();

    await expect(page.getByRole('button', { name: /Tarea 1: Superposición/i })).toBeVisible();
  });
});
