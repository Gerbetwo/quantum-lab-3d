import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task4Page extends MissionPage {
  async expectReady() {
    await expect(
      this.page.getByText(/Para qué NO sirve un Computador Cuántico/i)
    ).toBeVisible();
  }

  async complete() {
    await this.expectReady();

    await this.goToStep(3);
    await this.page
      .getByRole('button', { name: /Probar Algoritmo de Shor Cuántico/i })
      .click();
    await expect(this.page.getByTestId('shor-status')).toHaveText(
      /factorizada en 0\.42 segundos/i,
      { timeout: 10_000 }
    );

    await this.goToStep(4);
    await this.selectAnswer(/Simular moléculas complejas/i);
    await expect(this.page.getByText(/Excelente deducción/i)).toBeVisible();

    await this.page
      .getByRole('button', { name: /Finalizar Laboratorio/i })
      .click();
  }
}
