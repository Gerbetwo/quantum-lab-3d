import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import GatePalette from '@/features/circuit/components/GatePalette';

describe('Phase 3 - GatePalette iconographic', () => {
  it('renders one option per gate (9 by default)', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('option')).toHaveLength(9);
  });

  it('every option has an accessible name (aria-label / text)', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    const opts = screen.getAllByRole('option');
    for (const o of opts) {
      const label = o.getAttribute('aria-label') || o.textContent || '';
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('renders an svg icon inside each option', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    for (const o of screen.getAllByRole('option')) {
      expect(o.querySelector('svg')).toBeTruthy();
    }
  });

  it('preserves data-testid=gate-option-H (no regression)', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    expect(screen.getByTestId('gate-option-H')).toBeInTheDocument();
  });

  it('click on option fires onSelect with the gate key', () => {
    const onSelect = vi.fn();
    render(<GatePalette selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('gate-option-X'));
    expect(onSelect).toHaveBeenCalledWith('X');
  });

  it('marks selected gate with aria-selected=true', () => {
    render(<GatePalette selected="CNOT" onSelect={vi.fn()} />);
    expect(screen.getByTestId('gate-option-CNOT')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('gate-option-H')).toHaveAttribute('aria-selected', 'false');
  });
});
