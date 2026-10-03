import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task6Page extends MissionPage {
  async expectReady() {
    await expect(this.page.getByTestId('mission6-intro')).toBeVisible();
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(5);
    await this.selectAnswer(/amplifican la amplitud del elemento marcado/i);
    await expect(this.page.getByText(/Correcto\. Cada iteracion amplifica/i)).toBeVisible();

    await this.page
      .getByRole('button', { name: /Finalizar Entrenamiento/i })
      .click();
  }
}
