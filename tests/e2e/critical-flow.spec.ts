import { test, expect } from '@playwright/test';

test.describe('Phase 5: Critical Educational Journey Flow', () => {
  test('completes full quantum lab journey from landing page to celebration modal', async ({ page }) => {
    const step = (n: number) => page.getByRole('tab', { name: new RegExp('^Ir al paso ' + n + '\\b') });

    // 1. Landing
    await page.goto('/');
    await expect(page).toHaveTitle(/QuantumLab 3D/i);
    await page.getByRole('button', { name: /Iniciar Experimentos/i }).click();

    // 2. Task 1 - Superposition
    await expect(page.getByText(/El Bit Clásico/i)).toBeVisible();

    await step(4).click();
    await page.getByRole('button', { name: /Disparar Detector Láser/i }).click();
    await expect(page.getByTestId('collapse-result')).toBeVisible();

    await step(5).click();
    await page.getByRole('button', { name: /Colapsa forzosamente/i }).click();
    await expect(page.getByText(/Correcto! La medición destruye/i)).toBeVisible();
    await page.getByRole('button', { name: /Pasar a Tarea 2/i }).click();

    // 3. Task 2 - Entanglement
    await expect(page.getByText(/Dos Qubits Independientes/i)).toBeVisible();

    await step(4).click();
    await page.getByRole('button', { name: /Medir en Laboratorio de Alice/i }).click();
    await expect(page.getByTestId('correlation-result')).toBeVisible();

    await step(5).click();
    await page.getByRole('button', { name: /Instantáneamente el estado correlacionado/i }).click();
    await expect(page.getByText(/Correcto! En un estado entrelazado/i)).toBeVisible();
    await page.getByRole('button', { name: /Pasar a Tarea 3/i }).click();

    // 4. Task 3 - Decoherence
    await expect(page.getByText(/La Fragilidad Cuántica/i)).toBeVisible();

    await step(3).click();
    await page.getByRole('button', { name: /Activar Bombas Criogénicas/i }).click();
    await expect(page.getByTestId('cryo-active-banner')).toBeVisible();

    await step(4).click();
    await page.getByRole('button', { name: /Para eliminar el calor y las vibraciones/i }).click();
    await expect(page.getByText(/Exacto! El calor ambiente introduce/i)).toBeVisible();
    await page.getByRole('button', { name: /Pasar a Tarea 4/i }).click();

    // 5. Task 4 - Applications
    await expect(page.getByText(/Para qué NO sirve un Computador Cuántico/i)).toBeVisible();

    await step(3).click();
    await page.getByRole('button', { name: /Probar Algoritmo de Shor Cuántico/i }).click();
    await expect(page.getByTestId('shor-status')).toHaveText(/factorizada en 0\.42 segundos/i, { timeout: 10000 });

    await step(4).click();
    await page.getByRole('button', { name: /Simular moléculas complejas/i }).click();
    await expect(page.getByText(/Excelente deducción/i)).toBeVisible();
    await page.getByRole('button', { name: /Finalizar Laboratorio/i }).click();

    // 6. Celebration
    await expect(page.getByTestId('celebration-modal')).toBeVisible();
    await expect(page.getByTestId('celebration-user-id')).toHaveText(/^QL-[0-9A-F]{4}$/);
    await expect(page.getByRole('button', { name: /Cerrar y Revisar Módulos/i })).toBeVisible();
  });
});
