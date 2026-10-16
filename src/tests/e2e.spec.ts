import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CommandPalettePage } from './e2e/pages/CommandPalettePage';
import {
  LandingPage,
  Task1Page,
  Task2Page,
  Task3Page,
  Task4Page,
  Task5Page,
  Task6Page,
  Task7Page,
  CelebrationPage,
} from './pages';


test.describe('Command palette', () => {
  test('opens with Ctrl+K, filters, and closes with Escape', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.start();

    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.filter('pantalla');
    await palette.expectOption(/pantalla completa/i);
    await palette.close();
  });

  test('navigates to mission 2 via command', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.start();

    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.filter('entrelazamiento');
    await palette.execute(/entrelazamiento/i);

    await expect(page.getByTestId('header-mission-title')).toBeVisible();
  });
});


const SAME_ORIGIN = 'http://localhost:3000';
const FAVICON_RE = /\/favicon\.ico\$/;
const REACT_WARNING_RE = /^Warning:/;

test.describe('Console cleanliness audit', () => {
  test('no errors, uncaught exceptions, React warnings, or same-origin 404s', async ({ page }) => {
    const consoleErrors: string[] = [];
    const uncaughtExceptions: string[] = [];
    const reactWarnings: string[] = [];
    const sameOrigin404: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') consoleErrors.push(text);
      if (msg.type() === 'warning' && REACT_WARNING_RE.test(text)) {
        reactWarnings.push(text);
      }
    });

    page.on('pageerror', (err) => {
      uncaughtExceptions.push(err.message);
    });

    page.on('response', (response) => {
      if (response.status() !== 404) return;
      const url = response.url();
      if (FAVICON_RE.test(url)) return;
      if (!url.startsWith(SAME_ORIGIN)) return;
      sameOrigin404.push(url);
    });

    const landing = new LandingPage(page);
    await landing.goto();
    await landing.start();
    await new Task1Page(page).goToStep(5);

    expect(consoleErrors, `Console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
    expect(uncaughtExceptions, `Uncaught: ${uncaughtExceptions.join(' | ')}`).toEqual([]);
    expect(reactWarnings, `React warnings: ${reactWarnings.join(' | ')}`).toEqual([]);
    expect(sameOrigin404, `Same-origin 404s: ${sameOrigin404.join(' | ')}`).toEqual([]);
  });
});


test.describe('Full journey', () => {
  test('completes all 7 missions and reaches the celebration modal', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await expect(page).toHaveTitle(/QuantumLab 3D/i);
    await landing.start();

    await new Task1Page(page).complete();
    await new Task2Page(page).complete();
    await new Task3Page(page).complete();
    await new Task4Page(page).complete();
    await new Task5Page(page).complete();
    await new Task6Page(page).complete();
    await new Task7Page(page).complete();

    await new CelebrationPage(page).expectVisible();
  });
});


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


const VIEWPORTS = [
  { name: 'desktop-large', width: 1920, height: 1080 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

VIEWPORTS.forEach(({ name, width, height }) => {
  test.describe(`Auditoría Responsive y WCAG en ${name} (${width}x${height})`, () => {
    test.beforeEach(async ({}, testInfo) => {
      if (!process.env.RUN_VISUAL) {
        testInfo.skip(true, 'Pruebas de regresión visual deshabilitadas por defecto. Usa RUN_VISUAL=1 para ejecutarlas.');
      }
    });

    test.use({ viewport: { width, height } });

    test('captura snapshot visual y valida reglas de accesibilidad', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`homepage-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});