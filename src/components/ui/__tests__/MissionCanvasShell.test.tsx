import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MissionCanvasShell } from '../MissionCanvasShell';

describe('MissionCanvasShell', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders the 3 standardized tiers: Header, Viewport/Canvas, Ribbon', () => {
    render(
      <MissionCanvasShell
        tier2Canvas={<div data-testid="custom-test-canvas">Canvas 3D</div>}
      />
    );

    expect(screen.getByTestId('mission-canvas-shell')).toBeInTheDocument();
    expect(screen.getByTestId('tier-1-header')).toBeInTheDocument();
    expect(screen.getByTestId('tier-2-canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('tier-3-ribbon')).toBeInTheDocument();

    // Default inner elements
    expect(screen.getByTestId('custom-test-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('quantum-pipeline-ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle-button')).toBeInTheDocument();
  });

  it('supports overriding Tier 1, Tier 2, and Tier 3 with custom nodes', () => {
    render(
      <MissionCanvasShell
        tier1Header={<div data-testid="custom-header">Custom Tier 1</div>}
        tier2Canvas={<div data-testid="custom-canvas">Custom Tier 2 Canvas</div>}
        tier2Overlays={<div data-testid="custom-overlays">Custom Overlay Node</div>}
        tier3Ribbon={<div data-testid="custom-ribbon">Custom Tier 3 Ribbon</div>}
        bottomRightControls={null}
      >
        <div data-testid="child-overlay">Extra Child Overlay</div>
      </MissionCanvasShell>
    );

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('custom-overlays')).toBeInTheDocument();
    expect(screen.getByTestId('custom-ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('child-overlay')).toBeInTheDocument();

    // Overridden defaults should not be rendered
    expect(screen.queryByTestId('theme-toggle-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quantum-pipeline-ribbon')).not.toBeInTheDocument();
  });

  it('toggles theme when the floating theme toggle button is clicked', () => {
    render(
      <MissionCanvasShell
        tier2Canvas={<div data-testid="canvas-slot">Canvas</div>}
      />
    );

    const toggleButton = screen.getByTestId('theme-toggle-button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle theme');

    // Click to toggle
    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    // Click again to toggle back
    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders and toggles language via the Tier 1 language toggle button', () => {
    render(
      <MissionCanvasShell
        tier2Canvas={<div data-testid="canvas-slot">Canvas</div>}
      />
    );

    const langButton = screen.getByTestId('language-toggle-button');
    expect(langButton).toBeInTheDocument();
    expect(langButton).toHaveTextContent('EN');

    // Toggle to Spanish
    fireEvent.click(langButton);
    expect(langButton).toHaveTextContent('ES');
    expect(document.documentElement.lang).toBe('es');

    // Toggle back to English
    fireEvent.click(langButton);
    expect(langButton).toHaveTextContent('EN');
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders floating bottom-left return button when onReturnToTitle is provided', () => {
    let returned = false;
    render(
      <MissionCanvasShell
        tier2Canvas={<div data-testid="canvas-slot">Canvas</div>}
        onReturnToTitle={() => {
          returned = true;
        }}
      />
    );

    const returnBtn = screen.getByTestId('return-to-title-button');
    expect(returnBtn).toBeInTheDocument();
    expect(returnBtn).toHaveAttribute('aria-label', 'Return to Title');

    fireEvent.click(returnBtn);
    expect(returned).toBe(true);
  });

  it('does not render return button when onReturnToTitle is undefined', () => {
    render(
      <MissionCanvasShell
        tier2Canvas={<div data-testid="canvas-slot">Canvas</div>}
      />
    );

    expect(screen.queryByTestId('return-to-title-button')).not.toBeInTheDocument();
  });
});
