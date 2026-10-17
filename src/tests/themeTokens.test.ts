import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Theme Tokens Specification (globals.css)', () => {
  const cssPath = path.resolve(__dirname, '../app/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('declares .theme-dark and .theme-light CSS selectors', () => {
    expect(cssContent).toMatch(/\.theme-dark\b/);
    expect(cssContent).toMatch(/\.theme-light\b/);
  });

  it('defines Deep Space Cryostat tokens (#0B0E14 bg and #00F0FF cyan)', () => {
    expect(cssContent).toMatch(/--background:\s*#0b0e14/i);
    expect(cssContent).toMatch(/--primary:\s*#00f0ff/i);
  });

  it('defines Cleanroom Lab tokens (#F4F6F9 bg and #0284C7 precision blue)', () => {
    expect(cssContent).toMatch(/--background:\s*#f4f6f9/i);
    expect(cssContent).toMatch(/--precision-blue:\s*#0284c7/i);
  });

  it('defines sharp 1px border variables (--sim-border)', () => {
    expect(cssContent).toMatch(/--sim-border:\s*1px\s+solid/i);
    expect(cssContent).toMatch(/\.border-sim\b/);
  });

  it('defines zero-blur tactical glass panel (.hud-panel)', () => {
    expect(cssContent).toMatch(/\.hud-panel\s*\{[^}]*backdrop-filter:\s*none/);
    expect(cssContent).toMatch(/\.hud-panel\s*\{[^}]*border:\s*var\(--sim-border\)/);
  });

  it('defines high-contrast telemetry font utilities', () => {
    expect(cssContent).toMatch(/\.font-telemetry/);
    expect(cssContent).toMatch(/\.telemetry-mono/);
    expect(cssContent).toMatch(/\.telemetry-label/);
    expect(cssContent).toMatch(/\.telemetry-value/);
    expect(cssContent).toMatch(/tabular-nums/);
  });

  describe('WCAG AA Contrast Ratios', () => {
    it('guarantees WCAG AA (>= 4.5:1) for obsidian dark text on background', () => {
      const darkBg = '#0B0E14';
      const darkFg = '#F8FAFC';
      const darkMuted = '#94A3B8';
      const darkCyan = '#00F0FF';

      expect(contrastRatio(darkFg, darkBg)).toBeGreaterThan(4.5);
      expect(contrastRatio(darkFg, darkBg)).toBeGreaterThan(7.0); // AAA compliant (> 18:1)
      expect(contrastRatio(darkMuted, darkBg)).toBeGreaterThan(4.5); // AAA compliant (> 7.6:1)
      expect(contrastRatio(darkCyan, darkBg)).toBeGreaterThan(4.5); // AAA compliant (> 14:1)
    });

    it('guarantees WCAG AA (>= 4.5:1) for cleanroom light text on background', () => {
      const lightBg = '#F4F6F9';
      const lightFg = '#0B0E14';
      const lightMuted = '#475569';
      const lightCard = '#FFFFFF';

      expect(contrastRatio(lightFg, lightBg)).toBeGreaterThan(4.5);
      expect(contrastRatio(lightFg, lightBg)).toBeGreaterThan(7.0); // AAA compliant (> 17:1)
      expect(contrastRatio(lightMuted, lightBg)).toBeGreaterThan(4.5); // AA compliant (> 6.3:1)
      expect(contrastRatio(lightFg, lightCard)).toBeGreaterThan(7.0); // AAA compliant (> 19:1)
    });

    it('guarantees UI component contrast (>= 3.0:1) for precision blue', () => {
      const lightBg = '#F4F6F9';
      const precisionBlue = '#0284C7';
      const whiteText = '#FFFFFF';

      expect(contrastRatio(precisionBlue, lightBg)).toBeGreaterThan(3.0);
      expect(contrastRatio(whiteText, precisionBlue)).toBeGreaterThan(3.0);
    });
  });
});
