'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Mission1Superposition from '@/components/missions/Mission1Superposition';
import Mission2Entanglement from '@/components/missions/Mission2Entanglement';
import Mission3Decoherence from '@/components/missions/Mission3Decoherence';
import Mission4Applications from '@/components/missions/Mission4Applications';
import CelebrationModal from '@/components/CelebrationModal';
import { getStoredProgress, updateStoredMetrics } from '@/lib/cookies';
import { playButtonClick } from '@/lib/sound';
import { Check } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [completedMissions, setCompletedMissions] = useState<number[]>([0]);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);

  useEffect(() => {
    setCompletedMissions(getStoredProgress());
  }, []);

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });

      updateStoredMetrics((prev) => ({
        ...prev,
        totalTimeSeconds: prev.totalTimeSeconds + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleTabChange = (index: number) => {
    playButtonClick();
    setActiveTab(index);
  };

  const handleMissionComplete = (fromIndex: number) => {
    if (!completedMissions.includes(fromIndex + 1)) {
      setCompletedMissions((prev) => [...prev, fromIndex + 1]);
    }
    setActiveTab(fromIndex + 1);
  };

  const tabs = [
    { title: 'Tarea 1: Superposición', desc: 'Bit vs. Qubit y Colapso' },
    { title: 'Tarea 2: Entrelazamiento', desc: 'Alice & Bob a Distancia' },
    { title: 'Tarea 3: Cero Absoluto', desc: 'Criogenia y Decoherencia' },
    { title: 'Tarea 4: Aplicaciones', desc: 'Moléculas y Criptografía' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#070913] text-slate-100 min-h-screen">
      {/* Top Header */}
      <Header
        timeLeft={timeLeft}
        isRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
      />

      {/* Progress Track */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className="h-full bg-cyan transition-all duration-300 shadow-sm shadow-cyan/50"
          style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            const isDone = completedMissions.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  isActive
                    ? 'bg-slate-900/90 border-cyan text-white shadow-lg shadow-cyan/10 ring-1 ring-cyan/40'
                    : isDone
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-black/40 border-slate-900/80 text-slate-500 hover:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-orbitron font-semibold">
                  <span className={isActive ? 'text-cyan' : isDone ? 'text-emerald-400' : ''}>
                    {tab.title}
                  </span>
                  {isDone && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[11px] font-sans text-slate-400">{tab.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Active Mission Render */}
        <div className="flex-1 bg-black/70 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm flex flex-col">
          {activeTab === 0 && (
            <Mission1Superposition onComplete={() => handleMissionComplete(0)} />
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
              onFinishAll={() => setIsCelebrationOpen(true)}
              onBack={() => setActiveTab(2)}
            />
          )}
        </div>
      </main>

      {/* Completion Modal */}
      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
      />
    </div>
  );
}
