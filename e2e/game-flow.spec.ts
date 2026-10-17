import { test, expect, type Page } from '@playwright/test';

test.describe('Flight-Deck Game Loop E2E Sweep', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage for a pristine flight-deck state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('verifies full flow: Title Screen -> Campaign Launch -> Interactive 3D Manipulation -> ESC Pause Menu -> Options Toggle -> Return to Title', async ({ page }) => {
    // 1. Title Screen State
    const titleOverlay = page.getByTestId('title-screen-overlay');
    await expect(titleOverlay).toBeVisible();
    await expect(page.locator('h1')).toContainText('QUANTUMLAB');

    // Exactly 1 WebGL canvas in persistent background
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();

    // Start campaign via Title Screen action
    await titleOverlay.click();

    // 2. Campaign Roster Overlay
    const campaignOverlay = page.getByTestId('campaign-select-overlay');
    await expect(campaignOverlay).toBeVisible();
    await expect(titleOverlay).toBeHidden();

    // Verify presence of tactical mission cards
    await expect(page.getByTestId('mission-card-superposition')).toBeVisible();
    await expect(page.getByTestId('mission-card-entanglement')).toBeVisible();

    // Canvas still singleton
    await expect(page.locator('canvas')).toHaveCount(1);

    // Launch Mission 0 (Superposition)
    const launchSuperpositionBtn = page.getByTestId('launch-mission-superposition');
    await expect(launchSuperpositionBtn).toBeVisible();
    await launchSuperpositionBtn.click();

    // 3. In-Mission Workspace & Interactive 3D Manipulation
    const gateControls = page.getByTestId('floating-gate-controls');
    const missionHeader = page.getByTestId('mission-header');
    await expect(gateControls).toBeVisible();
    await expect(missionHeader).toBeVisible();
    await expect(campaignOverlay).toBeHidden();

    // Canvas remains single context in 3D viewport
    await expect(page.locator('canvas')).toHaveCount(1);

    // Gate Controls & Unitary Rotations: Apply Pauli-X Gate
    const gateX = page.getByTestId('gate-button-X');
    await expect(gateX).toBeVisible();
    await gateX.click();

    // Apply Hadamard Gate
    const gateH = page.getByTestId('gate-button-H');
    await expect(gateH).toBeVisible();
    await gateH.click();

    // Interactive angle sliders
    const sliderTheta = page.getByTestId('slider-theta');
    await expect(sliderTheta).toBeVisible();
    await sliderTheta.fill('1.57');

    const sliderPhi = page.getByTestId('slider-phi');
    await expect(sliderPhi).toBeVisible();
    await sliderPhi.fill('3.14');

    // Direct 3D Canvas Raycasting Pointer Drag Simulation
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;

      // Orbit camera drag
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 60, centerY - 40, { steps: 5 });
      await page.mouse.up();
    }

    // Zero-Spoiler Prediction & Quantum State Collapse
    const lockPredictionBtn = page.getByTestId('lock-guess-button');
    if (await lockPredictionBtn.isVisible()) {
      await lockPredictionBtn.click();
    }

    const measureBtn = page.getByTestId('measure-collapse-button');
    await expect(measureBtn).toBeVisible();
    await measureBtn.click();

    // Confirm measurement outcome registration
    await expect(page.getByText(/Outcome:/i)).toBeVisible();

    // 4. ESC Pause Menu Modal
    await page.keyboard.press('Escape');
    const pauseModal = page.getByTestId('pause-menu-modal');
    await expect(pauseModal).toBeVisible();

    // 5. System Options Toggle
    // Toggle Color Theme
    const themeToggle = page.getByTestId('pause-theme-toggle');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    // Toggle Audio
    const soundToggle = page.getByTestId('pause-sound-toggle');
    await expect(soundToggle).toBeVisible();
    const initialSoundText = await soundToggle.innerText();
    await soundToggle.click();
    const updatedSoundText = await soundToggle.innerText();
    expect(initialSoundText).not.toBe(updatedSoundText);

    // 6. Return to Title Screen
    const exitToTitleBtn = page.getByTestId('pause-exit-title-button');
    await expect(exitToTitleBtn).toBeVisible();
    await exitToTitleBtn.click();

    // Verify Title Screen is restored cleanly
    await expect(titleOverlay).toBeVisible();
    await expect(pauseModal).toBeHidden();
    await expect(gateControls).toBeHidden();

    // Single WebGL canvas guarantee
    await expect(page.locator('canvas')).toHaveCount(1);
  });

  test('maintains single WebGLRenderer context without memory leaks across multi-mode transitions', async ({ page }) => {
    // Helper to evaluate WebGL context status and context loss
    const checkWebGLContext = async (p: Page) => {
      await expect(p.locator('canvas')).toBeVisible();
      return p.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        if (canvases.length !== 1) {
          return { valid: false, count: canvases.length, lost: true };
        }
        const canvas = canvases[0];
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return {
          valid: Boolean(gl),
          count: canvases.length,
          lost: gl ? gl.isContextLost() : true,
        };
      });
    };

    // Initial state: Title
    let contextStatus = await checkWebGLContext(page);
    expect(contextStatus.valid).toBe(true);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Mode switch: Title -> Campaign
    await page.getByTestId('title-screen-overlay').click();
    await expect(page.getByTestId('campaign-select-overlay')).toBeVisible();

    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Mode switch: Campaign -> Mission 0
    await page.getByTestId('launch-mission-superposition').click();
    await expect(page.getByTestId('floating-gate-controls')).toBeVisible();

    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Mode switch: Mission -> Pause Modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu-modal')).toBeVisible();

    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Mode switch: Pause Modal -> Title
    await page.getByTestId('pause-exit-title-button').click();
    await expect(page.getByTestId('title-screen-overlay')).toBeVisible();

    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Mode switch: Title -> Campaign -> Sandbox
    await page.getByTestId('title-screen-overlay').click();
    await expect(page.getByTestId('campaign-select-overlay')).toBeVisible();
    await page.getByTestId('launch-sandbox-button').click();

    // Verify Sandbox view
    await expect(page.getByText('Quantum Sandbox Lab')).toBeVisible();
    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);
  });

  test('verifies console cleanliness during full game loop sweep', async ({ page }) => {
    const consoleErrors: string[] = [];
    const uncaughtExceptions: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      uncaughtExceptions.push(err.message);
    });

    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();

    // Cycle through Title -> Campaign -> Mission -> Pause -> Title
    await page.getByTestId('title-screen-overlay').click();
    await page.getByTestId('launch-mission-superposition').click();
    await page.getByTestId('gate-button-X').click();
    await page.getByTestId('measure-collapse-button').click();
    await page.keyboard.press('Escape');
    await page.getByTestId('pause-exit-title-button').click();

    expect(consoleErrors, `Console errors found: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(uncaughtExceptions, `Uncaught exceptions found: ${uncaughtExceptions.join(', ')}`).toEqual([]);
  });
});
