import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import GatePalette from '@/features/circuit/components/GatePalette';

describe('GatePalette', () => {
  it('renders a listbox with 9 default gates', () => {
    render(<GatePalette selected={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(9);
  });
  it('invokes onSelect with the clicked gate', () => {
    const onSelect = vi.fn();
    render(<GatePalette selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('gate-option-H'));
    expect(onSelect).toHaveBeenCalledWith('H');
  });
  it('marks the selected gate with aria-selected=true', () => {
    render(<GatePalette selected="X" onSelect={vi.fn()} />);
    expect(screen.getByTestId('gate-option-X')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('gate-option-H')).toHaveAttribute('aria-selected', 'false');
  });
  it('does not invoke onSelect when a gate is disabled', () => {
    const onSelect = vi.fn();
    render(<GatePalette selected={null} onSelect={onSelect} disabled={['H']} />);
    fireEvent.click(screen.getByTestId('gate-option-H'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});