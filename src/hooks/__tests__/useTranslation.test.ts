import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderHook, act } from '@testing-library/react';
import { useTranslation, getTranslation } from '../useTranslation';

describe('useTranslation & getTranslation', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('translates dot-notation keys in default English', () => {
    expect(getTranslation('ribbon.prepare', 'en')).toBe('1. PREPARE');
    expect(getTranslation('gates.hadamard.desc', 'en')).toBe('Creates equal superposition');
  });

  it('translates dot-notation keys in Spanish', () => {
    expect(getTranslation('ribbon.prepare', 'es')).toBe('1. PREPARAR');
    expect(getTranslation('gates.hadamard.desc', 'es')).toBe('Crea superposición equiprobable');
  });

  it('falls back to English when a key is missing in Spanish', () => {
    // Non-existent in Spanish but present in English (or testing missing key)
    expect(getTranslation('header.non_existent_key', 'es')).toBe('header.non_existent_key');
  });

  it('interpolates parameters correctly', () => {
    expect(getTranslation('header.mission', 'en', { mission: 'superposition' })).toBe(
      'Mission: superposition'
    );
    expect(getTranslation('header.mission', 'es', { mission: 'superposition' })).toBe(
      'Misión: superposition'
    );
  });

  it('toggles language between en and es via useTranslation hook', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.locale).toBe('en');
    expect(result.current.t('ribbon.prepare')).toBe('1. PREPARE');

    act(() => {
      result.current.toggleLanguage();
    });

    expect(result.current.locale).toBe('es');
    expect(result.current.t('ribbon.prepare')).toBe('1. PREPARAR');
    expect(document.documentElement.lang).toBe('es');
    expect(localStorage.getItem('ql-lang')).toBe('es');

    act(() => {
      result.current.toggleLocale();
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('ribbon.prepare')).toBe('1. PREPARE');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('ql-lang')).toBe('en');
  });

  it('allows explicitly setting language with setLanguage', () => {
    const { result } = renderHook(() => useTranslation());

    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.locale).toBe('es');
    expect(result.current.language).toBe('es');
    expect(result.current.t('ribbon.collapse')).toBe('COLAPSAR');
  });

  it('renders English on the server regardless of stored preference (hydration-safe)', () => {
    localStorage.setItem('ql-lang', 'es');
    function Probe() {
      const { t } = useTranslation();
      return React.createElement('span', null, t('ribbon.prepare'));
    }
    const html = renderToString(React.createElement(Probe));
    expect(html).toContain('1. PREPARE');
  });

  it('applies the stored locale only after mount', () => {
    localStorage.setItem('ql-lang', 'es');
    const { result } = renderHook(() => useTranslation());
    // renderHook flushes effects → post-mount locale applied
    expect(result.current.isMounted).toBe(true);
    expect(result.current.locale).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('does not overwrite stored preference on mount', () => {
    localStorage.setItem('ql-lang', 'es');
    renderHook(() => useTranslation());
    expect(localStorage.getItem('ql-lang')).toBe('es');
  });

  it('keeps multiple hook instances in sync via ql-lang-change', () => {
    const a = renderHook(() => useTranslation());
    const b = renderHook(() => useTranslation());
    expect(b.result.current.locale).toBe('en');

    act(() => {
      a.result.current.toggleLanguage();
    });

    expect(a.result.current.locale).toBe('es');
    expect(b.result.current.locale).toBe('es');
    expect(b.result.current.t('ribbon.prepare')).toBe('1. PREPARAR');
  });

  it('translates tabs, goals criteria, progress and spatial keys in en and es', () => {
    // Tabs
    expect(getTranslation('tabs.superposition', 'en')).toBe('1. Superposition');
    expect(getTranslation('tabs.superposition', 'es')).toBe('1. Superposición');
    expect(getTranslation('tabs.gates', 'en')).toBe('2. Gates');
    expect(getTranslation('tabs.gates', 'es')).toBe('2. Compuertas');

    // Goals & criteria
    expect(getTranslation('goals.status.completed', 'en')).toBe('COMPLETED');
    expect(getTranslation('goals.status.completed', 'es')).toBe('COMPLETADO');
    expect(getTranslation('goals.status.in_progress', 'en')).toBe('IN PROGRESS');
    expect(getTranslation('goals.status.in_progress', 'es')).toBe('EN PROGRESO');
    expect(getTranslation('goals.superposition.criteria', 'en')).toContain('Prepare state |+⟩');
    expect(getTranslation('goals.superposition.criteria', 'es')).toContain('Prepara el estado |+⟩');

    // Progress interpolation
    expect(getTranslation('progress.gates_count', 'en', { count: 1 })).toBe('1/2 gates');
    expect(getTranslation('progress.gates_count', 'es', { count: 1 })).toBe('1/2 compuertas');
    expect(getTranslation('progress.purity_status', 'en', { temp: 15, purity: 95 })).toBe('T = 15 mK, 95% purity');
    expect(getTranslation('progress.purity_status', 'es', { temp: 15, purity: 95 })).toBe('T = 15 mK, 95% pureza');

    // Ribbon controls
    expect(getTranslation('ribbon.controls.pause_animation', 'en')).toBe('Pause Animation');
    expect(getTranslation('ribbon.controls.pause_animation', 'es')).toBe('Pausar animación');
    expect(getTranslation('ribbon.controls.inject_flip_aria', 'en', { idx: 1 })).toBe('Inject Bit Flip into Qubit 1');
    expect(getTranslation('ribbon.controls.inject_flip_aria', 'es', { idx: 1 })).toBe('Inyectar inversión de bit en cúbit 1');

    // QEC node status
    expect(getTranslation('qec.node_status.corrupted', 'en')).toBe('Corrupted');
    expect(getTranslation('qec.node_status.corrupted', 'es')).toBe('Corrupto');

    // Spatial telemetry
    expect(getTranslation('spatial.state_vector.label', 'en')).toBe('Quantum State Vector');
    expect(getTranslation('spatial.state_vector.label', 'es')).toBe('Vector de estado cuántico');
  });
});
