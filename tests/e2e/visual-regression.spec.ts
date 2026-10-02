import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: 'desktop-large', width: 1920, height: 1080 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

VIEWPORTS.forEach(({ name, width, height }) => {
  test.describe(`Auditoría Responsive y WCAG en ${name} (${width}x${height})`, () => {
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
