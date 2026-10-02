import { test, expect } from '@playwright/test';

test.describe('Audit: Browser Console Cleanliness & Error Verification', () => {
  test('verifies zero console errors or uncaught exceptions during full session', async ({ page }) => {
    const consoleErrors: string[] = [];
    const uncaughtExceptions: string[] = [];

    // Escuchar mensajes de consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Escuchar excepciones no capturadas en runtime de la página
    page.on('pageerror', (error) => {
      uncaughtExceptions.push(error.message);
    });

    // Recorrer la experiencia principal
    await page.goto('/');
    await page.getByRole('button', { name: /Iniciar Experimentos/i }).click();

    // Navegar por cada una de las 4 tareas
    await page.getByTitle('Ir al paso 4').click();
    await page.getByTitle('Ir al paso 5').click();

    // Validar que no se registraron errores críticos en la consola del navegador
    expect(consoleErrors, `Console errors detected: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(uncaughtExceptions, `Uncaught exceptions detected: ${uncaughtExceptions.join(', ')}`).toEqual([]);
  });
});
