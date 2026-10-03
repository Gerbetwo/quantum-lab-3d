import { test, expect } from '@playwright/test';
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
