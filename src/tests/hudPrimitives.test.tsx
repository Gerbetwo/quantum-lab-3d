import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard, TelemetryValue } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

describe('Tactical HUD Primitives', () => {
  describe('GlassCard (src/components/ui/GlassCard.tsx)', () => {
    it('renders with tactical hud-panel styling', () => {
      render(
        <GlassCard title="Telemetry Test" badge="ONLINE">
          <div>Content</div>
        </GlassCard>
      );
      const card = screen.getByTestId('hud-glass-card');
      expect(card.className).toContain('hud-panel');
      expect(card.className).toContain('text-foreground');
    });

    it('renders title and badge with monospace font', () => {
      render(
        <GlassCard title="Dirac State" badge="|ψ⟩">
          <div>Content</div>
        </GlassCard>
      );
      expect(screen.getByText('Dirac State').className).toContain('font-mono');
      expect(screen.getByText('|ψ⟩').className).toContain('font-mono');
    });

    it('applies monospaced numeric styling to telemetry values', () => {
      render(
        <TelemetryValue label="Coherence T2" value={245.8} unit="μs" highlight="emerald" />
      );
      const label = screen.getByText('Coherence T2');
      const value = screen.getByText(/245\.8/);
      expect(label.className).toContain('font-mono');
      expect(value.className).toContain('tabular-nums');
      expect(value.className).toContain('font-mono');
    });
  });

  describe('Button (src/components/ui/Button.tsx)', () => {
    it('renders primary button with 1px sharp tactical borders and monospace font', () => {
      render(<Button variant="primary">Execute Gate</Button>);
      const btn = screen.getByRole('button', { name: /Execute Gate/i });
      expect(btn.className).toContain('font-mono');
      expect(btn.className).toContain('tabular-nums');
      expect(btn.className).toContain('border-quantum-cyan/40');
      expect(btn.style.boxShadow).toBe('none');
    });

    it('renders secondary button with tactical border and surface styling', () => {
      render(<Button variant="secondary">Reset Vector</Button>);
      const btn = screen.getByRole('button', { name: /Reset Vector/i });
      expect(btn.className).toContain('border-border');
      expect(btn.className).toContain('bg-surface-2');
      expect(btn.style.boxShadow).toBe('none');
    });

    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading Action</Button>);
      const btn = screen.getByRole('button', { name: /Loading Action/i });
      expect(btn.hasAttribute('disabled')).toBe(true);
      expect(screen.getByText('⟳')).toBeDefined();
    });
  });
});
