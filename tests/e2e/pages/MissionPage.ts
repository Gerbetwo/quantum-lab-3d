import { BasePage } from './BasePage';

export abstract class MissionPage extends BasePage {
  async goToStep(n: number) {
    await this.page
      .getByRole('tab', { name: new RegExp('^Ir al paso ' + n + '\\b') })
      .click();
  }

  async selectAnswer(label: RegExp) {
    await this.page.getByRole('button', { name: label }).click();
  }

  async advanceToNextTask(label: RegExp) {
    await this.page.getByRole('button', { name: label }).click();
  }
}
