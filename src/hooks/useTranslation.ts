'use client';

import { useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

export type Locale = 'en' | 'es';

const STORAGE_KEY = 'ql-lang';

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  es: es as Record<string, unknown>,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

/**
 * Pure translation lookup with automatic English fallback and string interpolation.
 */
export function getTranslation(
  key: string,
  locale: Locale = 'en',
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] || dictionaries.en;
  let val = getNestedValue(dict, key);
  if (val === undefined && locale !== 'en') {
    val = getNestedValue(dictionaries.en, key);
  }
  const template = val !== undefined ? val : key;
  return interpolate(template, params);
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
    if (navigator.language && navigator.language.startsWith('es')) {
      return 'es';
    }
  } catch {
    // Storage access might fail in constrained environments
  }
  return 'en';
}

/**
 * Lightweight, zero-dependency translation hook for QuantumLab 3D.
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Storage access error handling
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'en' ? 'es' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage access error handling
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return getTranslation(key, locale, params);
    },
    [locale]
  );

  return {
    locale,
    language: locale,
    setLocale,
    setLanguage: setLocale,
    toggleLocale,
    toggleLanguage: toggleLocale,
    t,
  };
}

export default useTranslation;
