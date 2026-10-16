'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Award, ExternalLink, CheckCircle2 } from 'lucide-react';

import { prefersReducedMotion } from '@/features/quantum-core/BlochViewport';
import { MISSIONS } from '@/features/quantum-core/quantum-missions-core';
import { useSession, useSessionTimer } from '@/archive/legacy-store-telemetry';
import { playChimeSuccess } from '@/lib/audio/audioEngine';

interface NavItem {
  id: string;
  label: string;
  href?: string | null;
  onClick?: (() => void) | null;
  active?: boolean | null;
}

interface AppNavigationProps {
  items: NavItem[];
}

// src/shared/layout/AppShell.tsx

interface AppShellProps {
  children?: React.ReactNode;
  header?: React.ReactNode | null;
  footer?: React.ReactNode | null;
  className?: string | null;
}

export function AppShell({ children, header, footer, className = '' }: AppShellProps) {
  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${className ?? ''}`}>
      {header}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {footer}
    </div>
  );
}


interface Props {
  isOpen: boolean;
  onClose: () => void;
  formUrl?: string | null;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CelebrationModal({ isOpen, onClose, formUrl }: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { session } = useSession();

  useEffect(() => {
    if (!isOpen) return;
    playChimeSuccess();
    if (!prefersReducedMotion()) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#a855f7', '#10b981', '#ffffff'],
      });
    }
    return () => {
      try { confetti.reset(); } catch { /* empty */ }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
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
    };

    modal.addEventListener('keydown', onKeyDown);
    return () => {
      modal.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const userId = session.userId;
  const titleId = 'celebration-modal-title';

  return (
    <div
      ref={modalRef}
      data-testid="celebration-modal"
      role="dialog" 
      aria-live="polite"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative max-w-lg w-full bg-[#0b0f1d] border border-border rounded-2xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan mb-3 shadow-lg shadow-cyan/15">
          <Award className="w-7 h-7 text-cyan" />
        </div>

        <h3 id={titleId} className="font-orbitron font-bold text-xl text-white tracking-wide">
          Entrenamiento Completado
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Has completado con éxito las siete misiones del recorrido guiado de computación cuántica.
        </p>

        <div className="w-full my-4 bg-background border border-border rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between border-b border-border pb-2 font-mono">
            <span className="text-muted-foreground">ID de sesión registrado:</span>
            <span data-testid="celebration-user-id" className="text-cyan font-bold">
              {userId}
            </span>
          </div>
          <div className="flex flex-col gap-2 pt-1 text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
              <span><strong>Superposición y Entrelazamiento:</strong> Dominio de los estados base y la correlación cuántica.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-axis-y shrink-0 mt-0.5" />
              <span><strong>Decoherencia y Aplicaciones:</strong> Comprensión del ruido térmico y casos de uso prácticos.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span><strong>Puertas y Algoritmos Avanzados:</strong> Manipulación directa y ejecución de Grover.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <span><strong>Corrección de Errores:</strong> Protección de estados mediante redundancia en qubits lógicos.</span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          {formUrl ? (
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-lg bg-cyan text-accent-foreground font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20"
            >
              Ir a la Evaluación <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-cyan text-accent-foreground font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20"
            >
              Cerrar y Revisar Módulos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


interface CommandItem {
  id: string | number;
  title: string;
  keywords?: string[];
  category?: string;
  action?: () => void;
}

/** @deprecated Use `CommandItem`. Alias kept for backward compatibility. */
export type Command = CommandItem;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  onSelectTab?: (tab: number) => void;
}

export function CommandPalette({
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
      const inKeywords = (c.keywords ?? []).some((_k) => _k.toLowerCase().includes(q));
      return inTitle || inKeywords;
    });
  }, [commands, query]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [isOpen]);

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
      setSelectedIndex((_i) => (_i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length === 0) return;
      setSelectedIndex((_i) => (_i - 1 + filtered.length) % filtered.length);
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-overlay-70 backdrop-blur-sm"
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
          onChange={(_e) => setQuery(_e.target.value)}
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


/**
- Header Component
- Displays active mission title, canonical timer, pause/resume control, 
- stable user ID, non-blocking storage warnings, theme toggle, and fullscreen control.
- Optimized for 375px mobile viewports using Tailwind v4 semantic variables.
 */


interface HeaderProps {
  title?: string | null;
  onAction?: (() => void) | null;
  actionLabel?: React.ReactNode | null;
  timeLeft?: string | number | null;
  isRunning?: boolean;
  onToggleTimer?: (() => void) | null;
  userId?: string | null;
  isHydrated?: boolean;
  storageWarning?: string | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: (() => void) | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: (() => void) | null;
}

export function Header({
  title = 'Quantum Lab 3D',
  onAction,
  actionLabel,
  timeLeft,
  isRunning = false,
  onToggleTimer,
  userId,
  isHydrated = false,
  storageWarning,
  theme = 'dark',
  onToggleTheme,
  isFullscreen = false,
  onToggleFullscreen,
}: HeaderProps) {
  const formattedTime = typeof timeLeft === 'number'
    ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
    : timeLeft;

  return (
    <header className="w-full flex flex-col bg-background border-b border-border text-foreground transition-colors duration-300">
      {storageWarning && (
        <div 
          role="alert" 
          aria-live="polite" 
          className="bg-warning/10 border-b border-warning-border px-3 sm:px-6 py-2 text-xs text-warning flex items-center justify-between"
        >
          <span className="truncate">⚠️ Storage Notice: {storageWarning}</span>
        </div>
      )}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 min-h-14 gap-2 overflow-x-auto">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <Link 
            href="/"
            className="font-bold tracking-wider text-accent text-xs sm:text-base truncate max-w-25 sm:max-w-xs hover:opacity-80 transition-opacity"
            title="Ir al inicio"
          >
            {title}
          </Link>
          {formattedTime !== undefined && formattedTime !== null && (
            <span data-testid="timer-display" className="text-xs px-2 py-1 bg-card rounded font-mono shrink-0">
              {formattedTime}
            </span>
          )}
          {onToggleTimer && (
            <button
              onClick={onToggleTimer}
              aria-label={isRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
              className="text-xs text-accent hover:underline shrink-0 px-1 py-0.5"
            >
              {isRunning ? 'Pausar' : 'Reanudar'}
            </button>
          )}
          {isHydrated && userId ? (
            <span data-testid="user-id-value" className="text-xs text-muted-foreground truncate max-w-17.5 sm:max-w-30" title={userId}>
              {userId}
            </span>
          ) : (
            <div aria-busy="true" data-testid="user-id-skeleton" className="w-12 sm:w-16 h-4 bg-card animate-pulse rounded shrink-0" />
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="px-2 py-1 bg-card hover:bg-muted text-foreground rounded text-xs transition-colors"
              title="Cambiar tema"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Entrar en pantalla completa'}
              className="px-2 py-1 bg-card hover:bg-muted text-foreground rounded text-xs transition-colors"
              title="Pantalla completa"
            >
              {isFullscreen ? '⤫ Exit FS' : '⤢ Fullscreen'}
            </button>
          )}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


/**
- LeanLabLayout Component
- Active route shell connecting session state, timer, command palette,
- light/dark theme persistence, and accessible fullscreen toggle.
 */


interface LeanLabLayoutProps {
  children: React.ReactNode;
  actionLabel?: React.ReactNode | null;
  onAction?: (() => void) | null;
}

export function LeanLabLayout({
  children,
  actionLabel,
  onAction,
}: LeanLabLayoutProps) {
  const router = useRouter();
  const { session, isHydrated, storageWarning } = useSession();
  const { formattedTime, isRunning, pauseTimer, resumeTimer } =
    useSessionTimer();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const savedTheme = localStorage.getItem("quantum_lab_theme") as "dark" | "light" | null;
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      return "light";
    }
    document.documentElement.classList.add("dark");
    return "dark";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("quantum_lab_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Fullscreen state listener and toggle handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.warn("Fullscreen API request rejected or unsupported:", error);
    }
  };

  // Global Ctrl+K / Cmd+K shortcut listener with editable context guard & cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setIsCommandPaletteOpen((_prev) => !_prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const commands: CommandItem[] = [
    {
      id: "home",
      title: "Inicio (Home)",
      keywords: ["home", "inicio", "main", "dashboard"],
      action: () => router.push("/"),
    },
    {
      id: "learn",
      title: "Aprender (Learn)",
      keywords: ["learn", "aprender", "courses", "education"],
      action: () => router.push("/learn"),
    },
    {
      id: "superposition",
      title: "Misión: Superposición",
      keywords: ["superposition", "mision", "superposicion", "qubit"],
      action: () => router.push("/missions/superposition"),
    },
    {
      id: "entanglement",
      title: "Misión: Entrelazamiento",
      keywords: ["entanglement", "mision", "entrelazamiento", "bell"],
      action: () => router.push("/missions/entanglement"),
    },
    {
      id: "decoherence",
      title: "Misión: Decoherencia Térmica",
      keywords: ["decoherence", "mision", "decoherencia", "thermal"],
      action: () => router.push("/missions/decoherence"),
    },
    {
      id: "applications",
      title: "Misión: Aplicaciones Reales",
      keywords: ["applications", "mision", "aplicaciones", "real world"],
      action: () => router.push("/missions/applications"),
    },
    {
      id: "gates",
      title: "Misión: Puertas Cuánticas",
      keywords: ["gates", "mision", "puertas", "quantum gates"],
      action: () => router.push("/missions/gates"),
    },
    {
      id: "grover",
      title: "Misión: Algoritmo de Grover",
      keywords: ["grover", "mision", "algoritmo", "search"],
      action: () => router.push("/missions/grover"),
    },
    {
      id: "error-correction",
      title: "Misión: Corrección de Errores",
      keywords: [
        "error-correction",
        "mision",
        "correccion",
        "errors",
        "stabilizer",
      ],
      action: () => router.push("/missions/error-correction"),
    },
  ];

  const activeMissionId = session.activeMission;
  const currentMission =
    activeMissionId && MISSIONS
      ? MISSIONS.find((_m) => _m.id === activeMissionId)
      : null;

  const missionTitle =
    currentMission?.title ||
    (activeMissionId ? `Mission: ${activeMissionId}` : "Quantum Lab 3D");

  const handleToggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header
        title={missionTitle}
        timeLeft={formattedTime}
        isRunning={isRunning}
        onToggleTimer={handleToggleTimer}
        userId={session.userId}
        isHydrated={isHydrated}
        storageWarning={storageWarning}
        theme={theme}
        onToggleTheme={toggleTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <main className="flex-1 flex flex-col relative overflow-x-hidden">
        {children}
      </main>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}



interface PageContainerProps {
  children: React.ReactNode;
  className?: string | null;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className ?? ''}`}>
      {children}
    </div>
  );
};


interface PageHeaderProps {
  title: string;
  description?: string | null;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold tracking-tight text-[#f3f6fc]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#a6b2c6]">{description}</p>}
    </div>
  );
};


const CANONICAL_MISSIONS = [
  'superposition',
  'entanglement',
  'error-correction',
  'gates',
  'decoherence',
  'grover',
  'applications',
];
// src/components/layout/AppShell.tsx