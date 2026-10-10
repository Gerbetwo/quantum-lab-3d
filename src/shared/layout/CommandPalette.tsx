'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface CommandItem {
  id: string | number;
  title: string;
  keywords?: string[];
  category?: string;
  action?: () => void;
}

/** @deprecated Use `CommandItem`. Alias kept for backward compatibility. */
export type Command = CommandItem;

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  onSelectTab?: (tab: number) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  commands,
  onSelectTab,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const inTitle = c.title.toLowerCase().includes(q);
      const inKeywords = (c.keywords ?? []).some((k) => k.toLowerCase().includes(q));
      return inTitle || inKeywords;
    });
  }, [commands, query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const execute = (cmd: CommandItem) => {
    onClose();
    if (cmd.action) {
      cmd.action();
    } else if (typeof cmd.id === 'number' && onSelectTab) {
      onSelectTab(cmd.id);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length === 0) return;
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length === 0) return;
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selectedIndex];
      if (cmd) execute(cmd);
    }
  };

  const activeId = filtered[selectedIndex]
    ? 'command-palette-option-' + filtered[selectedIndex].id
    : undefined;

  return (
    <div
      data-testid="command-palette"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-foreground/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Buscar comandos"
          aria-expanded="true"
          aria-controls="command-palette-listbox"
          aria-activedescendant={activeId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe un comando…"
          className="w-full px-4 py-3 bg-transparent border-b border-border text-sm text-foreground outline-none"
        />
        <ul
          id="command-palette-listbox"
          role="listbox"
          aria-label="Comandos disponibles"
          className="max-h-80 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-xs text-muted-foreground">Sin coincidencias</li>
          ) : (
            filtered.map((c, i) => (
              <li
                key={c.id}
                id={'command-palette-option-' + c.id}
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => execute(c)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={
                  'px-4 py-2.5 text-sm cursor-pointer transition-colors ' +
                  (i === selectedIndex ? 'bg-cyan/15 text-cyan' : 'text-muted-foreground')
                }
              >
                {c.title}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
