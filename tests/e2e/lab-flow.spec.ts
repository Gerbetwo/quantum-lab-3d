import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 4 - /lab end-to-end flow', () => {
  test('full flow: place gate, switch views, load GHZ, run circuit', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/lab');
    await expect(page.getByTestId('circuit-grid')).toBeVisible();

    await page.getByTestId('gate-option-H').click();
    await page.getByTestId('cell-0-0').click();

    await page.getByTestId('view-mode-histogram').click();
    await expect(page.getByTestId('view-mode-histogram')).toHaveAttribute('aria-selected', 'true');
    await page.getByTestId('view-mode-phase-disk').click();
    await expect(page.getByTestId('view-mode-phase-disk')).toHaveAttribute('aria-selected', 'true');
    await page.getByTestId('view-mode-bloch').click();

    await page.getByRole('button', { name: /GHZ 6-qubit/i }).click();

    await page.keyboard.press('ControlOrMeta+KeyK');
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await page.getByRole('combobox').fill('ejecutar');
    await page.getByRole('option', { name: /Ejecutar circuito completo/i }).click();

    await expect(page.getByTestId('measurement-particles-overlay')).toBeVisible();

    expect(consoleErrors, 'console errors: ' + consoleErrors.join(' | ')).toEqual([]);
    expect(pageErrors, 'page errors: ' + pageErrors.join(' | ')).toEqual([]);
  });

  test('command palette circuits:reset clears the grid', async ({ page }) => {
    await page.goto('/lab');
    await expect(page.getByTestId('circuit-grid')).toBeVisible();

    await page.getByTestId('gate-option-H').click();
    await page.getByTestId('cell-0-0').click();

    await page.keyboard.press('ControlOrMeta+KeyK');
    await page.getByRole('combobox').fill('limpiar');
    await page.getByRole('option', { name: /Limpiar circuito/i }).click();

    const label = (await page.getByTestId('cell-0-0').getAttribute('aria-label')) ?? '';
    expect(label).not.toMatch(/compuerta/);
  });

  test('@axe-core no WCAG 2.1 AA violations on /lab', async ({ page }) => {
    await page.goto('/lab');
    await expect(page.getByTestId('circuit-grid')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
