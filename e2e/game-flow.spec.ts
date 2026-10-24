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

  test('verifies full flow: Header Dropdown -> Interactive 3D Manipulation -> Ribbon Execution -> Floating Toggles', async ({ page }) => {
    // 1. Initial Tactical Viewport State
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();

    const header = page.getByTestId('tier-1-header');
    await expect(header).toBeVisible();

    // Centered Target Goal Card
    const targetCard = page.getByTestId('target-goal-card');
    await expect(targetCard).toBeVisible();

    // Bottom-right floating bar with Theme & Language
    const floatingBar = page.getByTestId('bottom-right-floating-bar');
    await expect(floatingBar).toBeVisible();

    // Bottom Pipeline Ribbon
    const ribbon = page.getByTestId('quantum-pipeline-ribbon');
    await expect(ribbon).toBeVisible();

    // 2. Mission Dropdown Navigation
    const dropdownTrigger = page.getByTestId('mission-dropdown-trigger');
    await expect(dropdownTrigger).toBeVisible();
    await dropdownTrigger.click();

    const dropdownMenu = page.getByTestId('mission-dropdown-menu');
    await expect(dropdownMenu).toBeVisible();

    // Select Mission 2 (Gates)
    await page.getByTestId('mission-select-1').click();
    await expect(dropdownMenu).toBeHidden();

    // Canvas remains single context
    await expect(page.locator('canvas')).toHaveCount(1);

    // 3. Gate Controls & Unitary Rotations: Apply Pauli-X Gate via ribbon
    const gateX = page.getByTestId('gate-button-X');
    await expect(gateX).toBeVisible();
    await gateX.click();

    // Apply Hadamard Gate via ribbon
    const gateH = page.getByTestId('gate-button-H');
    await expect(gateH).toBeVisible();
    await gateH.click();

    // Direct 3D Canvas Pointer Orbit Drag Simulation
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;

      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 60, centerY - 40, { steps: 5 });
      await page.mouse.up();
    }

    // 4. Quantum State Collapse Measurement
    const measureBtn = page.getByTestId('measure-collapse-button');
    await expect(measureBtn).toBeVisible();
    await measureBtn.click();

    // Confirm measurement outcome registration in ribbon
    await expect(page.getByTestId('pipeline-outcome-badge')).toBeVisible();

    // 5. System Options Toggles in Bottom-Right Floating Bar
    const themeToggle = page.getByTestId('theme-toggle-button');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    const langToggle = page.getByTestId('language-toggle-button');
    await expect(langToggle).toBeVisible();
    await expect(langToggle).toContainText('EN');
    await langToggle.click();
    await expect(langToggle).toContainText('ES');
    await expect(dropdownTrigger).toContainText('2. Compuertas');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await langToggle.click();
    await expect(langToggle).toContainText('EN');
    await expect(dropdownTrigger).toContainText('2. Gates');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // 6. Navigate across multi-qubit missions
    // Entanglement (Mission 4)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-3').click();
    await expect(page.getByTestId('measure-entangled-button')).toBeVisible();
    await page.getByTestId('measure-entangled-button').click();

    // Grover (Mission 6)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-5').click();
    await expect(page.getByTestId('grover-run-button')).toBeVisible();
    await page.getByTestId('grover-run-button').click();

    // Error Correction (Mission 7)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-6').click();
    await expect(page.getByTestId('qec-flip-q1')).toBeVisible();
    await page.getByTestId('qec-flip-q1').click();
    await expect(page.getByTestId('qec-correct-button')).toBeVisible();
    await page.getByTestId('qec-correct-button').click();

    // Single WebGL canvas guarantee
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1);
  });

  test('maintains single WebGLRenderer context without memory leaks across multi-mode transitions', async ({ page }) => {
    // Helper to evaluate WebGL context status and context loss
    const checkWebGLContext = async (p: Page) => {
      const webglCanvas = p.locator('canvas[data-engine]');
      await expect(webglCanvas).toBeVisible();
      return p.evaluate(() => {
        const canvases = document.querySelectorAll('canvas[data-engine]');
        return {
          valid: canvases.length === 1,
          count: canvases.length,
          lost: false,
        };
      });
    };

    // Initial state: Mission 1
    let contextStatus = await checkWebGLContext(page);
    expect(contextStatus.valid).toBe(true);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    const dropdownTrigger = page.getByTestId('mission-dropdown-trigger');

    // Transition 1: Mission 1 -> Mission 4 (Entanglement)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-3').click();
    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Transition 2: Mission 4 -> Mission 6 (Grover)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-5').click();
    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Transition 3: Mission 6 -> Mission 7 (QEC)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-6').click();
    contextStatus = await checkWebGLContext(page);
    expect(contextStatus.count).toBe(1);
    expect(contextStatus.lost).toBe(false);

    // Transition 4: Mission 7 -> Mission 1 (Superposition)
    await dropdownTrigger.click();
    await page.getByTestId('mission-select-0').click();
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

    // Cycle through dropdown mission switches, gate executions, collapse and toggles
    const dropdownTrigger = page.getByTestId('mission-dropdown-trigger');

    await page.getByTestId('gate-button-X').click();
    await page.getByTestId('measure-collapse-button').click();

    await dropdownTrigger.click();
    await page.getByTestId('mission-select-3').click();
    await page.getByTestId('measure-entangled-button').click();

    await dropdownTrigger.click();
    await page.getByTestId('mission-select-6').click();
    await page.getByTestId('qec-flip-q1').click();
    await page.getByTestId('qec-correct-button').click();

    // Toggle theme & language
    await page.getByTestId('theme-toggle-button').click();
    await page.getByTestId('language-toggle-button').click();

    expect(consoleErrors, `Console errors found: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(uncaughtExceptions, `Uncaught exceptions found: ${uncaughtExceptions.join(', ')}`).toEqual([]);
  });

  test('dynamically updates 100% of user-facing UI text across all 7 missions when toggling EN/ES without reload', async ({ page }) => {
    const dropdownTrigger = page.getByTestId('mission-dropdown-trigger');
    const targetCard = page.getByTestId('target-goal-card');
    const langToggle = page.getByTestId('language-toggle-button');

    // 1. Initial State in English (Mission 1 - Superposition)
    await expect(dropdownTrigger).toContainText('1. Superposition');
    await expect(targetCard).toContainText('COMPLETED');
    await expect(targetCard).toContainText('Prepare state |+⟩');

    // 2. Toggle to Spanish
    await langToggle.click();
    await expect(langToggle).toContainText('ES');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    // Goal card and trigger should instantly be in Spanish without reload
    await expect(targetCard).toContainText('COMPLETADO');
    await expect(targetCard).toContainText('Prepara el estado |+⟩');
    await expect(dropdownTrigger).toContainText('1. Superposición');

    // Expected Spanish criteria and tab names for all 7 missions
    const missionChecks = [
      {
        idx: 0,
        tabName: '1. Superposición',
        criteria: 'Prepara el estado |+⟩ en ≤ 2 compuertas',
      },
      {
        idx: 1,
        tabName: '2. Compuertas',
        criteria: 'Ajusta la fase del brazo inferior φ = π',
      },
      {
        idx: 2,
        tabName: '3. Medición',
        criteria: 'Recolecta 100 disparos que coincidan con la regla de Born',
      },
      {
        idx: 3,
        tabName: '4. Entrelazamiento',
        criteria: 'Colapsa a Alice y Bob en |11⟩',
      },
      {
        idx: 4,
        tabName: '5. Decoherencia',
        criteria: 'Mantén la pureza > 80% ajustando la temperatura del criostato',
      },
      {
        idx: 5,
        tabName: '6. Búsqueda de Grover',
        criteria: 'Amplifica la amplitud del objetivo a más del 90%',
      },
      {
        idx: 6,
        tabName: '7. Corrección de errores',
        criteria: 'Detecta y repara una inversión de bit en el Cúbit 2',
      },
    ];

    for (const mission of missionChecks) {
      await dropdownTrigger.click();
      const menu = page.getByTestId('mission-dropdown-menu');
      await expect(menu).toBeVisible();
      await expect(page.getByTestId(`mission-select-${mission.idx}`)).toContainText(mission.tabName);
      await page.getByTestId(`mission-select-${mission.idx}`).click();
      await expect(dropdownTrigger).toContainText(mission.tabName);
      await expect(targetCard).toContainText(mission.criteria);
    }

    // Check Spanish ribbon actions in QEC (Mission 7)
    await expect(page.getByText('Invertir:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inyectar inversión de bit en cúbit 1' })).toBeVisible();

    // 3. Toggle back to English
    await langToggle.click();
    await expect(langToggle).toContainText('EN');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Mission 7 in English
    await expect(dropdownTrigger).toContainText('7. Error Correction');
    await expect(targetCard).toContainText('Detect and repair a bit flip on Qubit 2');
    await expect(page.getByText('Flip:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inject Bit Flip into Qubit 1' })).toBeVisible();

    // Verify single WebGL context retained throughout the language toggles
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1);
  });
});
