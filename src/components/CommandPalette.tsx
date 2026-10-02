'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export interface Command {
  id: string;
  label: string;
  category?: 'navigation' | 'control';
  keywords?: string[];
  icon?: React.ReactNode;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function score(cmd: Command, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const label = cmd.label.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 50;
  const keys = cmd.keywords ? cmd.keywords.map((k) => k.toLowerCase()) : [];
  if (keys.some((k) => k.startsWith(q))) return 40;
  if (keys.some((k) => k.includes(q))) return 20;
  return 0;
}

export default function CommandPalette({ isOpen, onClose, commands }: Props) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () =>
      commands
        .map((c) => ({ c, s: score(c, query) }))
        .filter((entry) => entry.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((entry) => entry.c),
    [commands, query]
  );

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered, activeIndex]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-index="' + activeIndex + '"]') as HTMLElement | null;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const list = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener('keydown', onKeyDown);
    return () => {
      modal.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  const execute = useCallback(
    (cmd: Command) => {
      onClose();
      cmd.action();
    },
    [onClose]
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) execute(cmd);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      data-testid="command-palette"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[#0b0f1d] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Buscar comandos..."
            aria-label="Buscar comandos"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
          />
          <kbd className="text-[10px] font-mono text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Sin coincidencias para <span className="text-white font-mono">{query}</span>
          </div>
        ) : (
          <ul
            id="command-list"
            ref={listRef}
            role="listbox"
            aria-label="Comandos"
            className="max-h-[60vh] overflow-y-auto py-1"
          >
            {filtered.map((cmd, idx) => {
              const isActive = idx === activeIndex;
              return (
                <li
                  key={cmd.id}
                  role="option"
                  aria-selected={isActive}
                  data-index={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => execute(cmd)}
                  className={clsx(
                    'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
                    isActive ? 'bg-cyan/15 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  <span className="flex items-center gap-3">
                    {cmd.icon}
                    <span>{cmd.label}</span>
                  </span>
                  <ArrowRight
                    className={clsx('w-3.5 h-3.5', isActive ? 'text-cyan' : 'text-transparent')}
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-2">
            <span>Arriba/Abajo navegar</span>
            <span>Enter ejecutar</span>
          </span>
          <span>
            {filtered.length} de {commands.length}
          </span>
        </div>
      </div>
    </div>
  );
}
