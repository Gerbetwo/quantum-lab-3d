import { test, expect } from '@playwright/test';
import {
  LandingPage,
  Task1Page,
  Task2Page,
  Task3Page,
  Task4Page,
  CelebrationPage,
} from './pages';

const visualEnabled = process.env.RUN_VISUAL === '1';

test.describe('Visual regression', () => {
  test.skip(
    !visualEnabled,
    'Set RUN_VISUAL=1 to enable (requires committed baselines)'
  );

  test('landing page', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.expectReady();

    await expect(page).toHaveScreenshot('landing.png', {
      animations: 'disabled',
      maxDiffPixels: 200,
    });
  });

  test('celebration modal', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.start();

    await new Task1Page(page).complete();
    await new Task2Page(page).complete();
    await new Task3Page(page).complete();
    await new Task4Page(page).complete();

    const celebration = new CelebrationPage(page);
    await celebration.expectVisible();

    await expect(celebration.modal).toHaveScreenshot('celebration-modal.png', {
      animations: 'disabled',
      mask: [celebration.userId],
      maxDiffPixels: 200,
    });
  });

  test('mission 1 with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();

    const landing = new LandingPage(page);
    await landing.goto();
    await landing.start();

    await expect(page).toHaveScreenshot('mission1-reduced-motion.png', {
      animations: 'disabled',
      mask: [
        page.getByTestId('user-id-value'),
        page.getByTestId('timer-display'),
      ],
      maxDiffPixels: 200,
    });

    await context.close();
  });
});
