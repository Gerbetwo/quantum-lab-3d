import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import CircuitGrid from '@/features/circuit/components/CircuitGrid';
import { createEmptyCircuit, placeGate } from '@/core/quantum/circuit';

function _noop() {}

describe('CircuitGrid', () => {
  it('renders 6x16 gridcells for a 6-qubit 16-depth circuit', () => {
    const circuit = createEmptyCircuit(6, 16);
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={0}
        onPlaceGate={vi.fn()}
        onRemoveGate={vi.fn()}
        onSetPlayhead={vi.fn()}
      />,
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(96);
  });
  it('invokes onPlaceGate with (step, qubit) on click', () => {
    const circuit = createEmptyCircuit(2, 4);
    const onPlaceGate = vi.fn();
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate="H"
        playhead={0}
        onPlaceGate={onPlaceGate}
        onRemoveGate={vi.fn()}
        onSetPlayhead={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('cell-0-0'));
    expect(onPlaceGate).toHaveBeenCalledWith(0, 0);
  });
  it('highlights the playhead column', () => {
    const circuit = createEmptyCircuit(2, 4);
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={2}
        onPlaceGate={vi.fn()}
        onRemoveGate={vi.fn()}
        onSetPlayhead={vi.fn()}
      />,
    );
    expect(screen.getByTestId('playhead-2')).toHaveAttribute('data-playhead', 'true');
    expect(screen.getByTestId('playhead-1')).not.toHaveAttribute('data-playhead');
  });
  it('invokes onSetPlayhead on header click', () => {
    const circuit = createEmptyCircuit(2, 4);
    const onSetPlayhead = vi.fn();
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={0}
        onPlaceGate={vi.fn()}
        onRemoveGate={vi.fn()}
        onSetPlayhead={onSetPlayhead}
      />,
    );
    fireEvent.click(screen.getByTestId('playhead-3'));
    expect(onSetPlayhead).toHaveBeenCalledWith(3);
  });
  it('invokes onRemoveGate on Delete key over an occupied cell', () => {
    let circuit = createEmptyCircuit(2, 4);
    circuit = placeGate(circuit, { type: 'H', step: 0, targets: [0] });
    const onRemoveGate = vi.fn();
    render(
      <CircuitGrid
        circuit={circuit}
        activeGate={null}
        playhead={0}
        onPlaceGate={vi.fn()}
        onRemoveGate={onRemoveGate}
        onSetPlayhead={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByTestId('cell-0-0'), { key: 'Delete' });
    expect(onRemoveGate).toHaveBeenCalledTimes(1);
  });
});