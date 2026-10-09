
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { BlochSphereScene } from '../../../src/components/scenes/BlochSphereScene';

describe('BlochSphereScene Component', () => {
  test('renderiza el contenedor con rol img y aria-label', () => {
    const { container } = render(<BlochSphereScene theta={Math.PI / 2} />);
    const stage = container.querySelector('[role="img"]');
    expect(stage).toBeInTheDocument();
    expect(stage).toHaveAttribute('aria-label', 'Representación 3D interactiva de la Esfera de Bloch');
  });
});
