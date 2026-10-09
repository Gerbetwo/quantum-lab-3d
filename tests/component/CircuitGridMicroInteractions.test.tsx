import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import CircuitGrid from '@/features/circuit/components/CircuitGrid';
import { createEmptyCircuit } from '@/core/math/circuit';

function noop() {}

describe('Phase 3 - CircuitGrid micro-interactions', () => {
  it('renders gridcells for 6x16 circuit', () => {
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(6, 16)}
        activeGate={null}
        playhead={0}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    expect(screen.getAllByRole('gridcell')).toHaveLength(96);
  });

  it('marks the current playhead column with data-playhead=true', () => {
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate={null}
        playhead={2}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    expect(screen.getByTestId('playhead-2')).toHaveAttribute('data-playhead', 'true');
    expect(screen.getByTestId('playhead-1')).not.toHaveAttribute('data-playhead', 'true');
  });

  it('does not crash when activeGate is null', () => {
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate={null}
        playhead={0}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    expect(screen.getByTestId('circuit-grid')).toBeInTheDocument();
  });

  it('invokes onPlaceGate when clicking a cell with activeGate', () => {
    const onPlaceGate = vi.fn();
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate="H"
        playhead={0}
        onPlaceGate={onPlaceGate}
        onRemoveGate={noop}
        onSetPlayhead={noop}
      />
    );
    fireEvent.click(screen.getByTestId('cell-0-0'));
    expect(onPlaceGate).toHaveBeenCalledWith(0, 0);
  });

  it('invokes onSetPlayhead when clicking header column', () => {
    const onSet = vi.fn();
    render(
      <CircuitGrid
        circuit={createEmptyCircuit(2, 4)}
        activeGate={null}
        playhead={0}
        onPlaceGate={noop}
        onRemoveGate={noop}
        onSetPlayhead={onSet}
      />
    );
    fireEvent.click(screen.getByTestId('playhead-3'));
    expect(onSet).toHaveBeenCalledWith(3);
  });
});
