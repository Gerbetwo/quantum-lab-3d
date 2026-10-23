'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

/** Window event used to keep every mounted useTranslation() instance in sync. */
export const LOCALE_CHANGE_EVENT = 'ql-lang-change';

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'es';
}

/**
 * Client-only locale preference lookup (storage first, then browser language).
 * MUST only be called after mount — never during render — to keep SSR/hydration aligned.
 */
export function readPreferredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('es')) {
      return 'es';
    }
  } catch {
    // Storage access might fail in constrained environments
  }
  return 'en';
}

function persistAndBroadcast(next: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage access error handling
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<Locale>(LOCALE_CHANGE_EVENT, { detail: next }));
  }
}

/**
 * Lightweight, zero-dependency translation hook for QuantumLab 3D.
 * Always renders 'en' on the server AND on the first client frame (hydration-safe);
 * the persisted / browser locale is applied in a post-mount effect.
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isMounted, setIsMounted] = useState(false);
  const localeRef = useRef<Locale>('en');

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  // Post-mount: read preference + subscribe to cross-instance changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-hydration sync with browser storage
    setLocaleState(readPreferredLocale());
    setIsMounted(true);

    const onLocaleChange = (e: Event) => {
      const next = (e as CustomEvent<Locale>).detail;
      if (isLocale(next)) setLocaleState(next);
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
  }, []);

  useEffect(() => {
    if (isMounted && typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale, isMounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    localeRef.current = newLocale;
    setLocaleState(newLocale);
    persistAndBroadcast(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(localeRef.current === 'en' ? 'es' : 'en');
  }, [setLocale]);

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
    isMounted,
    t,
  };
}

export default useTranslation;
