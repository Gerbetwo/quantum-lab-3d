/**
 * LeanLabLayout Component
 * Active route shell connecting session state, timer, command palette,
 * light/dark theme persistence, and accessible fullscreen toggle.
 */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import CommandPalette, { CommandItem } from "./CommandPalette";
import { useSession } from "@/features/session/components/SessionProvider";
import { useSessionTimer } from "@/features/session/hooks/useSessionTimer";
import { MISSIONS } from "@/features/missions/config/missions";

interface LeanLabLayoutProps {
  children: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize theme from localStorage without resetting mission state
  useEffect(() => {
    const savedTheme = localStorage.getItem("quantum_lab_theme") as
      | "dark"
      | "light"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("quantum_lab_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
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
        setIsCommandPaletteOpen((prev) => !prev);
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
      ? MISSIONS.find((m) => m.id === activeMissionId)
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
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

export default LeanLabLayout;
