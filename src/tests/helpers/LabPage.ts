import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LabPage extends BasePage {
  readonly grid = this.page.getByTestId('circuit-grid');
  readonly palette = this.page.getByTestId('command-palette');
  readonly search = this.page.getByRole('combobox', { name: /buscar comandos/i });
  readonly particlesOverlay = this.page.getByTestId('measurement-particles-overlay');

  async goto(): Promise<void> {
    await this.page.goto('/lab');
    await expect(this.grid).toBeVisible();
  }

  async selectGate(gate: string): Promise<void> {
    await this.page.getByTestId('gate-option-' + gate).click();
  }

  async placeAt(step: number, qubit: number): Promise<void> {
    await this.page.getByTestId('cell-' + step + '-' + qubit).click();
  }

  async switchView(mode: 'bloch' | 'histogram' | 'phase-disk'): Promise<void> {
    await this.page.getByTestId('view-mode-' + mode).click();
  }

  async openPalette(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+KeyK');
    await expect(this.palette).toBeVisible();
  }

  async executeCommand(query: string, optionLabel: RegExp): Promise<void> {
    await this.search.fill(query);
    await this.page.getByRole('option', { name: optionLabel }).click();
  }
}
