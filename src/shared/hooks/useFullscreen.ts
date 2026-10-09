'use client';

import { useCallback, useEffect, useState } from 'react';

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const d = document as FullscreenDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? d.msFullscreenElement ?? null;
}

export interface UseFullscreenResult {
  isFullscreen: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

/**
 * SSR-safe Fullscreen API wrapper. Falls back gracefully when the API
 * is unavailable (jsdom, Safari old, permissions denied).
 */
export function useFullscreen(): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setIsFullscreen(Boolean(getFullscreenElement()));
    onChange();
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange as EventListener);
    };
  }, []);

  const enter = useCallback(async () => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement as FullscreenElement;
    const fn = el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen;
    if (!fn) return;
    try { await fn.call(el); } catch { /* denied by user or browser */ }
  }, []);

  const exit = useCallback(async () => {
    if (typeof document === 'undefined') return;
    const d = document as FullscreenDocument;
    const fn = d.exitFullscreen ?? d.webkitExitFullscreen ?? d.msExitFullscreen;
    if (!fn) return;
    try { await fn.call(d); } catch { /* no-op */ }
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) await exit();
    else await enter();
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
