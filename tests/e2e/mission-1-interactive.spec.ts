
import { test, expect } from '@playwright/test';

test.describe('Mission 1 Interactive E2E', () => {
  test('permite ajustar theta, medir y colapsar el qubit', async ({ page }) => {
    await page.goto('/');

    // Asegurar que estamos en la misión 1 (o navegar a ella)
    const measureButton = page.getByRole('button', { name: /Disparar Detector Láser/i });
    await expect(measureButton).toBeVisible();

    await measureButton.click();

    const resultBanner = page.getByText(/Resultado de Medición/i);
    await expect(resultBanner).toBeVisible();
  });
});
