import { expect } from '@playwright/test';
import { MissionPage } from './MissionPage';

export class Task4Page extends MissionPage {
  async expectReady() {
    await this.expectMissionTitle(
      /¿Para qué NO sirve un Computador Cuántico\?/i,
    );
  }

  async complete() {
    await this.expectReady();

    // Step 3: Shor algorithm interaction.
    //
    // IMPORTANTE:
    // Mission4Applications usa índices internos 0..3,
    // pero los tabs visibles son 1..4.
    //
    // step === 2 corresponde al tab "Ir al paso 3".
    await this.goToStep(3);

    const shorButton = this.page.getByRole('button', {
      name: /Probar Algoritmo de Shor Cuántico/i,
    });

    // Verificación semántica: si este assertion falla,
    // el problema está realmente en el renderizado del paso 3,
    // no en un timeout arbitrario.
    await expect(shorButton).toBeVisible({ timeout: 5_000 });
    await expect(shorButton).toBeEnabled();
    await shorButton.click();

    // Wait for the algorithm to finish.
    const shorStatus = this.page.getByTestId('shor-status');

    await expect(shorStatus).toBeVisible();
    await expect(shorStatus).toHaveText(
      /Algoritmo de Shor completado en 0\.42 segundos/i,
      { timeout: 10_000 },
    );

    // Step 4: final comprehension challenge.
    await this.goToStep(4);

    await this.selectAnswer(/Simular moléculas complejas/i);

    await expect(
      this.page.getByText(/Excelente deducción/i),
    ).toBeVisible();

    const finishButton = this.page.getByRole('button', {
      name: /Finalizar Laboratorio/i,
    });

    await expect(finishButton).toBeVisible();
    await expect(finishButton).toBeEnabled();
    await finishButton.click();
  }
}
