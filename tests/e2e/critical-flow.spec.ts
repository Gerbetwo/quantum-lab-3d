import { test, expect } from '@playwright/test';

test.describe('Phase 5: Critical Educational Journey Flow', () => {
  test('completes full quantum lab journey from landing page to celebration modal', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/QuantumLab 3D/i);

    const startBtn = page.getByRole('button', { name: /Iniciar Experimentos/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 2. Task 1: Superposition
    await expect(page.getByText(/El Bit Clásico/i)).toBeVisible();

    // Navigate to step 4 (Measurement) & execute laser scan
    await page.getByTitle('Ir al paso 4').click();
    const laserBtn = page.getByRole('button', { name: /Disparar Detector Láser/i });
    await expect(laserBtn).toBeVisible();
    await laserBtn.click();
    await expect(page.getByText(/¡Colapso Observado/i)).toBeVisible();

    // Navigate to step 5 (Quiz) & answer Option B
    await page.getByTitle('Ir al paso 5').click();
    await page.getByRole('button', { name: /Colapsa forzosamente/i }).click();
    await expect(page.getByText(/¡Correcto! La medición destruye/i)).toBeVisible();

    const goToTask2Btn = page.getByRole('button', { name: /Pasar a Tarea 2/i });
    await expect(goToTask2Btn).toBeVisible();
    await goToTask2Btn.click();

    // 3. Task 2: Entanglement
    await expect(page.getByText(/Dos Qubits Independientes/i)).toBeVisible();

    // Step 4: Measure Alice
    await page.getByTitle('Ir al paso 4').click();
    const aliceBtn = page.getByRole('button', { name: /Medir en Laboratorio de Alice/i });
    await expect(aliceBtn).toBeVisible();
    await aliceBtn.click();
    await expect(page.getByText(/¡Correlación Perfecta Instantánea!/i)).toBeVisible();

    // Step 5: Quiz B
    await page.getByTitle('Ir al paso 5').click();
    await page.getByRole('button', { name: /Instantáneamente el estado correlacionado/i }).click();
    await expect(page.getByText(/¡Correcto! En un estado entrelazado/i)).toBeVisible();

    const goToTask3Btn = page.getByRole('button', { name: /Pasar a Tarea 3/i });
    await expect(goToTask3Btn).toBeVisible();
    await goToTask3Btn.click();

    // 4. Task 3: Decoherence
    await expect(page.getByText(/La Fragilidad Cuántica/i)).toBeVisible();

    // Step 3: Cryo Shield
    await page.getByTitle('Ir al paso 3').click();
    const cryoBtn = page.getByRole('button', { name: /Activar Bombas Criogénicas/i });
    await expect(cryoBtn).toBeVisible();
    await cryoBtn.click();
    await expect(page.getByText(/Temperatura: 15 mK/i)).toBeVisible();

    // Step 4: Quiz B
    await page.getByTitle('Ir al paso 4').click();
    await page.getByRole('button', { name: /Para eliminar el calor y las vibraciones/i }).click();
    await expect(page.getByText(/¡Exacto! El calor ambiente introduce/i)).toBeVisible();

    const goToTask4Btn = page.getByRole('button', { name: /Pasar a Tarea 4/i });
    await expect(goToTask4Btn).toBeVisible();
    await goToTask4Btn.click();

    // 5. Task 4: Applications
    await expect(page.getByText(/¿Para qué NO sirve un Computador Cuántico?/i)).toBeVisible();

    // Step 3: Shor Algorithm Simulation
    await page.getByTitle('Ir al paso 3').click();
    const shorBtn = page.getByRole('button', { name: /Probar Algoritmo de Shor Cuántico/i });
    await expect(shorBtn).toBeVisible();
    await shorBtn.click();
    await expect(page.getByText(/¡Clave RSA factorizada en 0.42 segundos!/i)).toBeVisible({ timeout: 10000 });

    // Step 4: Final Quiz B
    await page.getByTitle('Ir al paso 4').click();
    await page.getByRole('button', { name: /Simular moléculas complejas/i }).click();
    await expect(page.getByText(/¡Excelente deducción!/i)).toBeVisible();

    // Finish Lab & Trigger Celebration Modal
    const finishBtn = page.getByRole('button', { name: /Finalizar Laboratorio/i });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // 6. Verify Celebration Modal
    await expect(page.getByRole('heading', { name: /Entrenamiento Completado/i })).toBeVisible();
    await expect(page.getByText(/ID de sesión registrado:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cerrar y Revisar Módulos/i })).toBeVisible();
  });
});
