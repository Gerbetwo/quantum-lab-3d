import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task3Page extends MissionPage {
  async expectReady() {
    await this.expectMissionTitle(/La Fragilidad Cuántica/i);
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(3);
    await this.page
      .getByRole('button', { name: /Activar Bombas Criogénicas/i })
      .click();
    await expect(this.page.getByTestId('cryo-active-banner')).toBeVisible();

    await this.goToStep(4);
    await this.selectAnswer(/Para eliminar el calor y las vibraciones/i);
    await expect(
      this.page.getByText(/Exacto! El calor ambiente introduce/i)
    ).toBeVisible();

    await this.advanceToNextTask(/Pasar a Tarea 4/i);
  }
}
