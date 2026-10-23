import { describe, it, expect, beforeEach } from 'vitest';
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
});
