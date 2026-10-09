import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import PhaseDiskView from '@/features/circuit/components/viewports/PhaseDiskView';
import { createZeroState } from '@/core/math/statevector';

describe('PhaseDiskView', () => {
  it('renders a canvas with role=img and aria-label', () => {
    render(<PhaseDiskView state={createZeroState(6)} />);
    const canvas = screen.getByTestId('phase-disk-view');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
    expect(canvas).toHaveAttribute('role', 'img');
    expect(canvas.getAttribute('aria-label')).toBeTruthy();
  });
  it('renders without crashing for small states', () => {
    render(<PhaseDiskView state={createZeroState(2)} />);
    expect(screen.getByTestId('phase-disk-view')).toBeInTheDocument();
  });
  it('is accessible by role img with name match', () => {
    render(<PhaseDiskView state={createZeroState(3)} />);
    expect(screen.getByRole('img', { name: /fase|amplitud/i })).toBeInTheDocument();
  });
});