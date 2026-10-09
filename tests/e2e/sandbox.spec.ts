import { test, expect } from '@playwright/test';

test.describe('E2E Quantum Sandbox Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sandbox');
  });

  test('debe cargar la interfaz completa del Sandbox sin estado mock', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Quantum Sandbox Laboratory');
    await expect(page.locator('text=Catálogo de Puertas')).toBeVisible();
    await expect(page.locator('button:has-text("Medir Circuito")')).toBeVisible();
  });

  test('debe permitir cambiar la escala de qubits', async ({ page }) => {
    const select = page.locator('#qubit-count');
    await select.selectOption('4');
    await expect(page.locator('footer')).toContainText('Estado Vectorial:');
  });

  test('debe disparar la medición correctamente', async ({ page }) => {
    const measureBtn = page.locator('button:has-text("Medir Circuito")');
    await measureBtn.click();
    await expect(page.locator('footer')).toContainText('Resultado Medido:');
  });
});
