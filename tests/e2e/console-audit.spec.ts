import { test, expect } from '@playwright/test';
import { LandingPage, Task1Page } from './pages';

const SAME_ORIGIN = 'http://localhost:3000';
const FAVICON_RE = /\/favicon\.ico$/;
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
