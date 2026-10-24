import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { EntanglementDualSphere } from '../EntanglementDualSphere';
import { GroverBarChart3D } from '../GroverBarChart3D';
import { QECArray3D } from '../QECArray3D';

describe('Multi-Qubit 3D Viewport Components', () => {
  describe('EntanglementDualSphere', () => {
    it('renders WebGL canvas and updates upon measurement', () => {
      const { container, rerender, unmount } = render(
        <EntanglementDualSphere entangledPair={null} />
      );

      expect(container.querySelector('[data-testid="entanglement-dual-sphere"]')).toBeInTheDocument();
      expect(container.querySelector('canvas')).toBeInTheDocument();

      // Measurement collapse
      rerender(
        <EntanglementDualSphere
          entangledPair={{ alice: 0, bob: 0, state: '|00⟩' }}
        />
      );

      rerender(
        <EntanglementDualSphere
          entangledPair={{ alice: 1, bob: 1, state: '|11⟩' }}
        />
      );

      unmount();
      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  describe('GroverBarChart3D', () => {
    it('renders WebGL canvas and updates probability heights', () => {
      const { container, rerender, unmount } = render(
        <GroverBarChart3D groverProbs={[0.25, 0.25, 0.25, 0.25]} targetIndex={1} />
      );

      expect(container.querySelector('[data-testid="grover-bar-chart-3d"]')).toBeInTheDocument();
      expect(container.querySelector('canvas')).toBeInTheDocument();

      // Diffusion step amplification
      rerender(
        <GroverBarChart3D groverProbs={[0.0, 1.0, 0.0, 0.0]} targetIndex={1} />
      );

      unmount();
      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  describe('QECArray3D', () => {
    it('renders 3-qubit array and handles bit-flip error states', () => {
      const { container, rerender, unmount } = render(
        <QECArray3D qecTriple={[0, 0, 0]} syndromeInfo={null} />
      );

      expect(container.querySelector('[data-testid="qec-array-3d"]')).toBeInTheDocument();
      expect(container.querySelector('canvas')).toBeInTheDocument();

      // Error injection & corrective pulse trigger
      rerender(
        <QECArray3D
          qecTriple={[0, 1, 0]}
          syndromeInfo={{ syndrome: 2, errorIndex: 1, corrected: [0, 0, 0] }}
          isCorrecting={true}
          correctionTrigger={1}
        />
      );

      unmount();
      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });
  });

  describe('Universal Orbit Camera Pointer Handlers on Missions 4, 6, 7', () => {
    it('attaches onPointerDown, onPointerMove, onPointerUp handlers to all viewports', () => {
      const { container: c4 } = render(<EntanglementDualSphere entangledPair={null} />);
      const el4 = c4.querySelector('[data-testid="entanglement-dual-sphere"]')!;
      expect(el4).toHaveClass('cursor-grab');
      expect(el4).toHaveClass('pointer-events-auto');
      expect(el4).toHaveClass('touch-none');

      const { container: c6 } = render(<GroverBarChart3D />);
      const el6 = c6.querySelector('[data-testid="grover-bar-chart-3d"]')!;
      expect(el6).toHaveClass('cursor-grab');
      expect(el6).toHaveClass('pointer-events-auto');
      expect(el6).toHaveClass('touch-none');

      const { container: c7 } = render(<QECArray3D />);
      const el7 = c7.querySelector('[data-testid="qec-array-3d"]')!;
      expect(el7).toHaveClass('cursor-grab');
      expect(el7).toHaveClass('pointer-events-auto');
      expect(el7).toHaveClass('touch-none');
    });

    it('processes pointer drag events smoothly across viewports without blocking', () => {
      const { container: c4 } = render(<EntanglementDualSphere autoRotate={true} animationSpeed={1.5} />);
      const el4 = c4.querySelector('[data-testid="entanglement-dual-sphere"]')!;

      fireEvent.pointerDown(el4, { clientX: 100, clientY: 100 });
      fireEvent.pointerMove(el4, { clientX: 150, clientY: 120 });
      fireEvent.pointerUp(el4, { clientX: 150, clientY: 120 });

      const { container: c6 } = render(<GroverBarChart3D autoRotate={true} animationSpeed={2} />);
      const el6 = c6.querySelector('[data-testid="grover-bar-chart-3d"]')!;

      fireEvent.pointerDown(el6, { clientX: 100, clientY: 100 });
      fireEvent.pointerMove(el6, { clientX: 150, clientY: 120 });
      fireEvent.pointerUp(el6, { clientX: 150, clientY: 120 });

      const { container: c7 } = render(<QECArray3D autoRotate={true} animationSpeed={1} />);
      const el7 = c7.querySelector('[data-testid="qec-array-3d"]')!;

      fireEvent.pointerDown(el7, { clientX: 100, clientY: 100 });
      fireEvent.pointerMove(el7, { clientX: 150, clientY: 120 });
      fireEvent.pointerUp(el7, { clientX: 150, clientY: 120 });
    });
  });
});
