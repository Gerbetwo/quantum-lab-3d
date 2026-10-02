import { test, expect } from '@playwright/test';

test.describe('Phase 1: E2E Baseline Smoke Flow', () => {
  test('verifies home page loads correctly and displays brand header', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/QuantumLab 3D/i);

    const brandHeading = page.locator('header').getByText(/QUANTUMLAB/i);
    await expect(brandHeading).toBeVisible();

    // Entrar al laboratorio desde la pantalla de bienvenida
    await page.getByRole('button', { name: /Iniciar Experimentos/i }).click();

    // Validar que se cargó la Tarea 1 verificando su título en pantalla
    await expect(page.getByText(/El Bit Clásico/i)).toBeVisible();
  });
});