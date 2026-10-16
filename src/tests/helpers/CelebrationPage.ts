import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CelebrationPage extends BasePage {
  readonly modal = this.page.getByTestId('celebration-modal');
  readonly userId = this.page.getByTestId('celebration-user-id');
  readonly closeButton = this.page.getByRole('button', {
    name: /Cerrar y Revisar Módulos/i,
  });

  async expectVisible() {
    await expect(this.modal).toBeVisible();
    await expect(this.userId).toHaveText(/^QL-[0-9A-F]{4}$/);
    await expect(this.closeButton).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.modal).toBeHidden();
  }
}
