import { test, expect } from '@playwright/test';

test.describe('QuantumLab 3D - Phase 1 Sandbox & Navigation Flow', () => {
  test('Prueba A - Entrada desde la página principal', async ({ page }) => {
    await page.goto('/');
    const openLabBtn = page.getByTestId('open-lab-btn').or(page.getByRole('link', { name: /laboratorio/i }));
    await expect(openLabBtn).toBeVisible();
    await openLabBtn.click();
    await expect(page).toHaveURL(/sandbox/);
    await expect(page.getByTestId('circuit-workbench')).toBeVisible();
    await expect(page.getByTestId('circuit-grid')).toBeVisible();
  });

  test('Prueba B - Acceso directo /sandbox y redirección /lab', async ({ page }) => {
    // Direct /sandbox access
    await page.goto('/sandbox');
    await expect(page.getByTestId('circuit-workbench')).toBeVisible();

    // Redirect /lab -> /sandbox
    await page.goto('/lab');
    await expect(page).toHaveURL(/sandbox/);
    await expect(page.getByTestId('circuit-workbench')).toBeVisible();
  });

  test('Prueba C - Interacción básica con el workbench', async ({ page }) => {
    await page.goto('/sandbox');
    await expect(page.getByTestId('circuit-workbench')).toBeVisible();

    // Select Hadamard gate and place it
    const hGate = page.getByRole('button', { name: /^H$/i }).or(page.getByTestId('gate-H'));
    if (await hGate.isVisible()) {
      await hGate.click();
    }

    // Select preset
    const presetSelector = page.getByTestId('preset-selector');
    if (await presetSelector.isVisible()) {
      await presetSelector.selectOption({ index: 1 });
    }

    // Reset circuit
    const resetBtn = page.getByTestId('reset-circuit-btn');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    }
  });
});
