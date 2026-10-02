'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Mission1Superposition from '@/components/missions/Mission1Superposition';
import Mission2Entanglement from '@/components/missions/Mission2Entanglement';
import Mission3Decoherence from '@/components/missions/Mission3Decoherence';
import Mission4Applications from '@/components/missions/Mission4Applications';
import CelebrationModal from '@/components/CelebrationModal';
import {
  getOrCreateUserId,
  getStoredProgress,
  incrementActiveMissionTime,
} from '@/lib/cookies';
import { playButtonClick } from '@/lib/sound';
import { Play, RotateCcw } from 'lucide-react';

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [completedMissions, setCompletedMissions] = useState<number[]>([0]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    const progress = getStoredProgress();
    setCompletedMissions(progress);
  }, []);

  useEffect(() => {
    if (!isStarted || isTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });

      incrementActiveMissionTime(activeTab);
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isTimeUp, activeTab]);

  const handleMissionComplete = (missionIndex: number) => {
    const updatedProgress = getStoredProgress();
    setCompletedMissions(updatedProgress);

    if (missionIndex < 3) {
      setActiveTab(missionIndex + 1);
    } else {
      setShowCelebration(true);
    }
  };

  const handleTabSelect = (tabIndex: number) => {
    playButtonClick();
    setActiveTab(tabIndex);
  };

  const handleStartLab = () => {
    playButtonClick();
    setIsStarted(true);
  };

  const handleRestartLab = () => {
    playButtonClick();
    setTimeLeft(600);
    setIsTimeUp(false);
    setActiveTab(0);
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan selection:text-slate-950">
      <Header
        timeLeft={timeLeft}
        isRunning={isStarted && !isTimeUp}
        onToggleTimer={() => setIsStarted((prev) => !prev)}
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
            Bienvenido al simulador interactivo de mecánica cuántica. Explora la superposición, el entrelazamiento, la decoherencia y las aplicaciones reales mediante simulaciones en 3D en vivo.
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
              <h2 className="text-2xl font-orbitron font-bold text-white mb-2">
                ¡Tiempo Límite Agotado!
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Has alcanzado el tiempo límite de 10 minutos para esta sesión de laboratorio. Puedes reiniciar el tiempo para continuar explorando los módulos.
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
          {activeTab === 0 && (
            <Mission1Superposition
              onComplete={() => handleMissionComplete(0)}
            />
          )}
          {activeTab === 1 && (
            <Mission2Entanglement
              onComplete={() => handleMissionComplete(1)}
              onBack={() => setActiveTab(0)}
            />
          )}
          {activeTab === 2 && (
            <Mission3Decoherence
              onComplete={() => handleMissionComplete(2)}
              onBack={() => setActiveTab(1)}
            />
          )}
          {activeTab === 3 && (
            <Mission4Applications
              onFinishAll={() => handleMissionComplete(3)}
              onBack={() => setActiveTab(2)}
            />
          )}
        </div>
      )}

      {showCelebration && (
        <CelebrationModal
          onClose={() => setShowCelebration(false)}
          isOpen={false}
        />
      )}
    </main>
  );
}
