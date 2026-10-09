'use client';

import { useEffect, useSyncExternalStore } from 'react';

let currentTitle = '';
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getSnapshot = (): string => currentTitle;
const getServerSnapshot = (): string => '';

function setMissionTitle(next: string): void {
  if (next === currentTitle) return;
  currentTitle = next;
  for (const cb of listeners) cb();
}

/**
 * Read the current mission title. Returns '' when no mission is mounted.
 * Consumed by <Header /> to render the title in its center slot.
 */
export function useMissionTitleState(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Publish the title for the currently mounted mission / step.
 * Cleans up on unmount and whenever `title` changes.
 */
export function useMissionTitle(title: string): void {
  useEffect(() => {
    setMissionTitle(title);
    return () => {
      if (currentTitle === title) setMissionTitle('');
    };
  }, [title]);
}
