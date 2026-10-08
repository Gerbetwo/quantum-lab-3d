import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task2Page extends MissionPage {
  async expectReady() {
    await this.expectMissionTitle(/Dos Qubits Independientes/i);
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(4);
    await this.page
      .getByRole('button', { name: /Medir en Laboratorio de Alice/i })
      .click();
    await expect(this.page.getByTestId('correlation-result')).toBeVisible();

    await this.goToStep(5);
    await this.selectAnswer(/Instantáneamente el estado correlacionado/i);
    await expect(
      this.page.getByText(/Correcto! En un estado entrelazado/i)
    ).toBeVisible();

    await this.advanceToNextTask(/Pasar a Tarea 3/i);
  }
}
