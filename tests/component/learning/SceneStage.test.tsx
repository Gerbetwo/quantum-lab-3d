
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SceneStage } from '../../../src/components/learning/SceneStage';

describe('SceneStage Component', () => {
  test('renderiza etiqueta y children correctamente', () => {
    render(
      <SceneStage label="Test Stage">
        <div data-testid="child-canvas">Canvas Mock</div>
      </SceneStage>
    );

    expect(screen.getByText(/Test Stage/i)).toBeInTheDocument();
    expect(screen.getByTestId('child-canvas')).toBeInTheDocument();
  });

  test('muestra fallback cuando hasWebGL es falso', () => {
    render(
      <SceneStage label="Test Stage" hasWebGL={false}>
        <div>Canvas Mock</div>
      </SceneStage>
    );

    expect(screen.getByText(/WebGL no está disponible/i)).toBeInTheDocument();
  });
});
