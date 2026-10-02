import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task5Page extends MissionPage {
  async expectReady() {
    await expect(this.page.getByTestId('mission5-intro')).toBeVisible();
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(5);
    await this.selectAnswer(/superposicion perfecta/i);
    await expect(this.page.getByText(/Correcto! H sobre/i)).toBeVisible();

    await this.page
      .getByRole('button', { name: /Finalizar Entrenamiento/i })
      .click();
  }
}
