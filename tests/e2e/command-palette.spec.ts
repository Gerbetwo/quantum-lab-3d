import { test, expect } from '@playwright/test';
import { LandingPage } from './pages';
import { CommandPalettePage } from './pages/CommandPalettePage';

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
