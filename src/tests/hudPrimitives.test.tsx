import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard, TelemetryValue } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

describe('Tactical HUD Primitives', () => {
  describe('GlassCard (src/components/ui/GlassCard.tsx)', () => {
    it('renders with 1px sharp borders (border-slate-300 light, border-slate-800 dark)', () => {
      render(
        <GlassCard title="Telemetry Test" badge="ONLINE">
          <div>Content</div>
        </GlassCard>
      );
      const card = screen.getByTestId('hud-glass-card');
      expect(card.className).toContain('border-slate-300');
      expect(card.className).toContain('dark:border-slate-800');
    });

    it('removes drop-shadow fluff in favor of flat tactical design', () => {
      render(
        <GlassCard title="No Shadow Test">
          <div>Content</div>
        </GlassCard>
      );
      const card = screen.getByTestId('hud-glass-card');
      expect(card.style.boxShadow).toBe('none');
    });

    it('renders sub-pixel corner notches when cornerNotch is true', () => {
      const { container } = render(
        <GlassCard cornerNotch={true} title="Notch Test">
          <div>Content</div>
        </GlassCard>
      );
      const notches = container.querySelectorAll('span[aria-hidden="true"]');
      expect(notches.length).toBe(4);
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
      expect(btn.className).toContain('dark:border-cyan-500/50');
    });

    it('renders secondary button with 1px sharp borders (slate-300 light, slate-800 dark)', () => {
      render(<Button variant="secondary">Reset Vector</Button>);
      const btn = screen.getByRole('button', { name: /Reset Vector/i });
      expect(btn.className).toContain('border-slate-300');
      expect(btn.className).toContain('dark:border-slate-800');
      expect(btn.style.boxShadow).toBe('none');
    });

    it('renders corner notch accents when cornerNotch is enabled', () => {
      const { container } = render(<Button cornerNotch>Notched Button</Button>);
      const notches = container.querySelectorAll('span[aria-hidden="true"]');
      expect(notches.length).toBe(4);
    });

    it('supports telemetry codes and monospaced numeric labels', () => {
      render(
        <Button telemetryCode="SYS.01">
          Outcome |0⟩ (98.5%)
        </Button>
      );
      expect(screen.getByText('[SYS.01]')).toBeDefined();
      expect(screen.getByRole('button').className).toContain('tabular-nums');
    });
  });
});
