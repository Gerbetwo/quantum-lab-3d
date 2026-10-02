import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task1Page extends MissionPage {
  async expectReady() {
    await expect(this.page.getByText(/El Bit Clásico/i)).toBeVisible();
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(4);
    await this.page
      .getByRole('button', { name: /Disparar Detector Láser/i })
      .click();
    await expect(this.page.getByTestId('collapse-result')).toBeVisible();

    await this.goToStep(5);
    await this.selectAnswer(/Colapsa forzosamente/i);
    await expect(
      this.page.getByText(/Correcto! La medición destruye/i)
    ).toBeVisible();

    await this.advanceToNextTask(/Pasar a Tarea 2/i);
  }
}
