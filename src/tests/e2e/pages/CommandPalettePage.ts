import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CommandPalettePage extends BasePage {
  readonly palette = this.page.getByTestId('command-palette');
  readonly searchInput = this.page.getByRole('combobox', { name: /buscar comandos/i });

  async open() {
    await this.page.keyboard.press('ControlOrMeta+KeyK');
    await expect(this.palette).toBeVisible();
  }

  async close() {
    await this.page.keyboard.press('Escape');
    await expect(this.palette).toBeHidden();
  }

  async filter(text: string) {
    await this.searchInput.fill(text);
  }

  async expectOption(label: RegExp) {
    await expect(this.page.getByRole('option', { name: label })).toBeVisible();
  }

  async execute(label: RegExp) {
    await this.page.getByRole('option', { name: label }).click();
  }
}
