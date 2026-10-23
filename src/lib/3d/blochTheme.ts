/**
 * Theme-adaptive palette for raw Three.js scenes.
 * Reads semantic CSS design tokens from :root so WebGL materials follow the active
 * Obsidian Dark / Cleanroom Light theme, with per-theme opacities that keep grid lines legible.
 */

export interface BlochPalette {
  isDark: boolean;
  primary: number;
  foreground: number;
  purple: number;
  success: number;
  wireOpacity: number;
  ringOpacity: number;
  axesOpacity: number;
  diskOpacity: number;
}

const DARK_FALLBACK = { primary: 0x00f0ff, foreground: 0xf8fafc, purple: 0xa855f7, success: 0x10b981 };
const LIGHT_FALLBACK = { primary: 0x0284c7, foreground: 0x0b0e14, purple: 0x6d28d9, success: 0x047857 };

function parseHex(raw: string | null | undefined, fallback: number): number {
  const v = (raw ?? '').trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v) ?? /^#([0-9a-f]{3})$/i.exec(v);
  if (!m) return fallback;
  const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return parseInt(hex, 16);
}

export function isDarkThemeActive(): boolean {
  if (typeof document === 'undefined') return true;
  const cl = document.documentElement.classList;
  if (cl.contains('theme-light')) return false;
  return cl.contains('dark') || cl.contains('theme-dark') || !cl.length;
}

export function readBlochPalette(): BlochPalette {
  const isDark = isDarkThemeActive();
  const fb = isDark ? DARK_FALLBACK : LIGHT_FALLBACK;
  let css: CSSStyleDeclaration | null = null;
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    css = window.getComputedStyle(document.documentElement);
  }
  const get = (name: string) => css?.getPropertyValue(name);

  return {
    isDark,
    primary: parseHex(get('--primary'), fb.primary),
    foreground: parseHex(get('--foreground'), fb.foreground),
    purple: parseHex(get('--quantum-purple'), fb.purple),
    success: parseHex(get('--success'), fb.success),
    // Light backgrounds wash out thin translucent lines → boost opacity
    wireOpacity: isDark ? 0.15 : 0.32,
    ringOpacity: isDark ? 0.3 : 0.55,
    axesOpacity: isDark ? 0.25 : 0.5,
    diskOpacity: isDark ? 0.25 : 0.3,
  };
}

/**
 * Subscribes to theme class changes on <html>. Returns an unsubscribe function.
 */
export function observeThemeChanges(onChange: (palette: BlochPalette) => void): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return () => {};
  const obs = new MutationObserver(() => onChange(readBlochPalette()));
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}
