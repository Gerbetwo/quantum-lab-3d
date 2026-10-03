"use client";

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import Header from "@/components/Header";
import CelebrationModal from "@/components/CelebrationModal";
import {
  getOrCreateUserId,
  getStoredProgress,
  incrementActiveMissionTime,
  getStoredActiveTab,
  saveActiveTab,
} from "@/lib/cookies";
import { playButtonClick, isAudioEnabled, setAudioEnabled } from "@/lib/sound";
import { useFullscreen } from "@/hooks/useFullscreen";
import CommandPalette, { type Command } from "@/components/CommandPalette";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, Loader2 } from "lucide-react";

const Mission1Superposition = lazy(() => import("@/components/missions/Mission1Superposition"));
const Mission2Entanglement = lazy(() => import("@/components/missions/Mission2Entanglement"));
const Mission3Decoherence = lazy(() => import("@/components/missions/Mission3Decoherence"));
const Mission4Applications = lazy(() => import("@/components/missions/Mission4Applications"));
const Mission5Gates = lazy(() => import("@/components/missions/Mission5Gates"));
const Mission6Grover = lazy(() => import("@/components/missions/Mission6Grover"));
const Mission7ErrorCorrection = lazy(() => import("@/components/missions/Mission7ErrorCorrection"));

function MissionLoading() {
  return (
    <div
      data-testid="mission-loading"
      className="flex-1 flex items-center justify-center py-16 text-slate-400"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-cyan" />
      <span className="ml-3 text-sm font-mono">Cargando módulo…</span>
    </div>
  );
}

export default function Home() {
  const [userId, setUserId] = useState<string>("");
  const [completedMissions, setCompletedMissions] = useState<number[]>([0]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState<boolean>(false);

  // Phase 3: command palette + fullscreen + runtime audio toggle
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [audioOn, setAudioOn] = useState<boolean>(() => isAudioEnabled());
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const timeLeftRef = useRef<number>(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  useEffect(() => {
    setUserId(getOrCreateUserId());
    setCompletedMissions(getStoredProgress());
    setActiveTab(getStoredActiveTab());
  }, []);

  useEffect(() => { saveActiveTab(activeTab); }, [activeTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!isStarted || isTimeUp) return;
    const timer = setInterval(() => {
      const current = timeLeftRef.current;
      if (current <= 1) {
        setIsTimeUp(true);
        setTimeLeft(0);
        return;
      }
      setTimeLeft(current - 1);
      incrementActiveMissionTime(activeTab);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isTimeUp, activeTab]);

  const handleMissionComplete = useCallback((missionIndex: number) => {
    const updatedProgress = getStoredProgress();
    setCompletedMissions(updatedProgress);
    if (missionIndex < 6) setActiveTab(missionIndex + 1);
  }, []);

  const handleTabSelect = useCallback((tabIndex: number) => {
    playButtonClick();
    setActiveTab(tabIndex);
  }, []);

  const handleStartLab = useCallback(() => { playButtonClick(); setIsStarted(true); }, []);
  const handleRestartLab = useCallback(() => {
    playButtonClick();
    setTimeLeft(600);
    setIsTimeUp(false);
    setActiveTab(0);
  }, []);
  const handleToggleTimer = useCallback(() => { setIsStarted((prev) => !prev); }, []);
  const handleDismissCelebration = useCallback(() => { setCelebrationDismissed(true); }, []);

  const showCelebration = completedMissions.includes(6) && !celebrationDismissed;

  const handleToggleAudio = useCallback(() => {
    const next = !isAudioEnabled();
    setAudioEnabled(next);
    setAudioOn(next);
  }, []);

  const commands: Command[] = React.useMemo(() => {
    const missionNames = ['Superposicion', 'Entrelazamiento', 'Decoherencia', 'Aplicaciones', 'Compuertas Cuanticas', 'Busqueda de Grover', 'Correccion de Errores'];
    const cmds: Command[] = missionNames.map((name, i) => ({
      id: 'goto-mission-' + i,
      label: 'Ir a Tarea ' + (i + 1) + ': ' + name,
      keywords: ['mision', 'tarea', 'm' + (i + 1), name.toLowerCase()],
      category: 'navigation',
      action: () => handleTabSelect(i),
    }));
    cmds.push({
      id: 'restart',
      label: 'Reiniciar laboratorio',
      keywords: ['restart', 'reiniciar', 'reset', 'tiempo'],
      category: 'control',
      action: handleRestartLab,
    });
    cmds.push({
      id: 'toggle-audio',
      label: audioOn ? 'Silenciar audio' : 'Activar audio',
      keywords: ['audio', 'sound', 'mute', 'silenciar', 'sonido'],
      category: 'control',
      action: handleToggleAudio,
    });
    cmds.push({
      id: 'toggle-fullscreen',
      label: isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa',
      keywords: ['fullscreen', 'pantalla', 'f11'],
      category: 'control',
      action: () => { void toggleFullscreen(); },
    });
    cmds.push({
      id: 'goto-sandbox',
      label: 'Abrir Sandbox (exploracion libre)',
      keywords: ['sandbox', 'libre', 'explorar'],
      category: 'navigation',
      action: () => router.push('/sandbox'),
    });
    return cmds;
  }, [audioOn, isFullscreen, handleTabSelect, handleRestartLab, handleToggleAudio, toggleFullscreen, router]);

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan selection:text-slate-950">
      <Header
        timeLeft={timeLeft}
        isRunning={isStarted && !isTimeUp}
        onToggleTimer={handleToggleTimer}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {!isStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            Masterclass de Computación Cuántica 3D
          </div>
          <h1 className="text-4xl sm:text-6xl font-orbitron font-bold tracking-tight text-white mb-6 leading-tight">
            LABORATORIO DE <span className="text-cyan">FÍSICA CUÁNTICA</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed max-w-2xl">
            Bienvenido al simulador interactivo de mecánica cuántica. Explora la
            superposición, el entrelazamiento, la decoherencia y las
            aplicaciones reales mediante simulaciones en 3D en vivo.
          </p>
          <button
            onClick={handleStartLab}
            className="py-4 px-8 rounded-2xl bg-cyan text-slate-950 hover:bg-cyan/90 font-orbitron font-bold text-sm uppercase tracking-wider flex items-center gap-3 transition-all shadow-xl shadow-cyan/25 active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" /> Iniciar Experimentos
          </button>
        </div>
      ) : isTimeUp ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 rounded-3xl bg-slate-950 border border-rose-500/40 shadow-2xl flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-orbitron font-bold text-xl">
              10:00
            </div>
            <div>
              <h2 className="text-2xl font-orbitron font-bold text-white mb-2">¡Tiempo Límite Agotado!</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Has alcanzado el tiempo límite de 10 minutos para esta sesión de
                laboratorio. Puedes reiniciar el tiempo para continuar explorando los módulos.
              </p>
            </div>
            <button
              onClick={handleRestartLab}
              className="py-3.5 px-6 rounded-2xl bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-cyan/90 transition-all shadow-lg shadow-cyan/20 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Reiniciar Temporizador
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
          <Suspense fallback={<MissionLoading />}>
            {activeTab === 0 && <Mission1Superposition onComplete={() => handleMissionComplete(0)} />}
            {activeTab === 1 && (
              <Mission2Entanglement
                onComplete={() => handleMissionComplete(1)}
                onBack={() => handleTabSelect(0)}
              />
            )}
            {activeTab === 2 && (
              <Mission3Decoherence
                onComplete={() => handleMissionComplete(2)}
                onBack={() => handleTabSelect(1)}
              />
            )}
            {activeTab === 3 && (
              <Mission4Applications
                onFinishAll={() => handleMissionComplete(3)}
                onBack={() => handleTabSelect(2)}
              />
            )}
            {activeTab === 4 && (
              <Mission5Gates
                onComplete={() => handleMissionComplete(4)}
                onBack={() => handleTabSelect(3)}
              />
            )}
            {activeTab === 5 && (
              <Mission6Grover
                onComplete={() => handleMissionComplete(5)}
                onBack={() => handleTabSelect(4)}
              />
            )}
            {activeTab === 6 && (
              <Mission7ErrorCorrection
                onComplete={() => handleMissionComplete(6)}
                onBack={() => handleTabSelect(5)}
              />
            )}
          </Suspense>
        </div>
      )}

      {showCelebration && (
        <CelebrationModal onClose={handleDismissCelebration} isOpen={showCelebration} />
      )}

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </main>
  );
}
