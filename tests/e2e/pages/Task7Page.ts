import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task7Page extends MissionPage {
  async expectReady() {
    await expect(this.page.getByTestId('mission7-intro')).toBeVisible();
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(5);
    await this.selectAnswer(/votacion mayoritaria/i);
    await expect(this.page.getByText(/Correcto\. Tres copias/i)).toBeVisible();

    await this.page
      .getByRole('button', { name: /Finalizar Entrenamiento/i })
      .click();
  }
}
