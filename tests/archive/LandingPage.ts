import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  readonly heading = this.page.getByRole('heading', {
    name: /LABORATORIO DE FÍSICA CUÁNTICA/i,
  });
  readonly startButton = this.page.getByRole('button', {
    name: /Iniciar Experimentos/i,
  });

  async goto() {
    await this.page.goto('/');
  }

  async expectReady() {
    await expect(this.startButton).toBeVisible();
  }

  async start() {
    await this.startButton.click();
  }
}
