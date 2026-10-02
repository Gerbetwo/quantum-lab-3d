import { test, expect } from '@playwright/test';
import {
  LandingPage,
  Task1Page,
  Task2Page,
  Task3Page,
  Task4Page,
  CelebrationPage,
} from './pages';

test.describe('Full journey', () => {
  test('completes all 4 missions and reaches the celebration modal', async ({ page }) => {
    // 1. Landing
    const landing = new LandingPage(page);
    await landing.goto();
    await expect(page).toHaveTitle(/QuantumLab 3D/i);
    await landing.start();

    // 2-5. Sequential mission completion (page advances automatically)
    await new Task1Page(page).complete();
    await new Task2Page(page).complete();
    await new Task3Page(page).complete();
    await new Task4Page(page).complete();

    // 6. Celebration
    await new CelebrationPage(page).expectVisible();
  });
});
