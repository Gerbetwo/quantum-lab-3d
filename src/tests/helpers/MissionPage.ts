import { expect } from "@playwright/test";

import { BasePage } from "./BasePage";

export abstract class MissionPage extends BasePage {
  readonly missionTitle = this.page.getByTestId("header-mission-title");

  async expectMissionTitle(name: RegExp): Promise<void> {
    await expect(this.missionTitle).toBeVisible();
    await expect(this.missionTitle).toHaveText(name);
  }

  async goToStep(n: number): Promise<void> {
    const stepTab = this.page.getByRole("tab", {
      name: `Ir al paso ${n}`,
    });

    await expect(stepTab).toBeVisible();
    await expect(stepTab).toBeEnabled();

    await stepTab.click();
  }

  async selectAnswer(label: RegExp): Promise<void> {
    const answer = this.page.getByRole("button", {
      name: label,
    });

    await expect(answer).toBeVisible();
    await expect(answer).toBeEnabled();

    await answer.click();
  }

  async advanceToNextTask(label: RegExp): Promise<void> {
    const nextButton = this.page.getByRole("button", {
      name: label,
    });

    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();

    await nextButton.click();
  }
}
