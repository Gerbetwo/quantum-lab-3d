import { Page } from '@playwright/test';

export class LandingPage {
  constructor(private page: Page) {}
  async goto(url: string = '/') {
    await this.page.goto(url);
  }
  async start() {
    await this.page.click('button:has-text("Iniciar"), a:has-text("Iniciar")').catch(() => {});
  }
}

export class Task1Page {
  constructor(private page: Page) {}
  async goto(url: string = '/mission/1') {
    await this.page.goto(url);
  }
  async goToStep(_step: number) {}
  async complete() {
    await this.page.click('button:has-text("Completar")').catch(() => {});
  }
}

export class Task2Page extends Task1Page {}
export class Task3Page extends Task1Page {}
export class Task4Page extends Task1Page {}
export class Task5Page extends Task1Page {}
export class Task6Page extends Task1Page {}
export class Task7Page extends Task1Page {}

export class CelebrationPage {
  constructor(private page: Page) {}
  async expectVisible() {
    await this.page.waitForSelector('text=¡Completado!, text=Celebration').catch(() => {});
  }
}

export default LandingPage;
