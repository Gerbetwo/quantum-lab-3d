import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

describe('useTheme Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('initializes with dark theme by default and sets DOM classes', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('toggles theme between dark and light directly on document.documentElement', () => {
    const { result } = renderHook(() => useTheme());

    // Toggle to light
    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(localStorage.getItem('ql-theme')).toBe('light');

    // Toggle back to dark
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    expect(localStorage.getItem('ql-theme')).toBe('dark');
  });

  it('allows explicitly setting theme with setTheme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('restores stored preference from localStorage', () => {
    localStorage.setItem('ql-theme', 'light');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('never overwrites a stored light preference during mount', () => {
    localStorage.setItem('ql-theme', 'light');
    renderHook(() => useTheme());
    expect(localStorage.getItem('ql-theme')).toBe('light');
  });

  it('renders the dark default on the server regardless of storage (hydration-safe)', () => {
    localStorage.setItem('ql-theme', 'light');
    function Probe() {
      const { theme } = useTheme();
      return React.createElement('span', null, theme);
    }
    expect(renderToString(React.createElement(Probe))).toContain('dark');
  });

  it('syncs theme across hook instances', () => {
    const a = renderHook(() => useTheme());
    const b = renderHook(() => useTheme());
    act(() => {
      a.result.current.toggle();
    });
    expect(b.result.current.theme).toBe('light');
  });
});
